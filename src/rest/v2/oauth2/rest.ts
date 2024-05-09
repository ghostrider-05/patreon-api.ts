import { VERSION } from "../../../utils"
import { RouteBases } from "../routes"

type RestResponse = Response

type RestRetries =
    | number
    | { status: [number, number] | number, retries: number }[]

export interface RESTOptions {
    api: string
    authPrefix: string

    fetch: (url: string, init: RequestInit) => Promise<RestResponse>
    getAccessToken: () => Promise<string | undefined>

    headers: Record<string, string>

    retries: RestRetries
    userAgentAppendix: string | undefined
}

interface RequestOptions {
    api?: string
    route?: string

    query?: string

    auth?: boolean

    authPrefix?: string
    accessToken?: string | undefined
    body?: string | undefined

    headers?: Record<string, string>
    timeout?: number

    fetch?: ((url: string, init: RequestInit) => Promise<RestResponse>) | undefined
    signal?: AbortSignal | undefined
}

const PATREON_RESPONSE_HEADERS = {
    Sha: 'x-patreon-sha',
    UUID: 'x-patreon-uuid',
} as const

const DefaultRestOptions: RESTOptions = {
    authPrefix: 'Bearer',
    api: RouteBases.oauth2,
    fetch: (...args) => fetch(...args),
    getAccessToken: async () => undefined,
    // Set to number for the typecast to be correct
    retries: 3,
    headers: {},
    userAgentAppendix: '',
}

enum RequestMethod {
    Get = 'GET',
    Patch = 'PATCH',
    Post = 'POST',
}

type PatreonHeadersData = Record<Lowercase<keyof typeof PATREON_RESPONSE_HEADERS>, string | null>

interface InternalRequestOptions extends RequestOptions {
    path: string
    method: RequestMethod
}

interface PatreonErrorData {
    id: string
    code: number
    code_name: string
    detail: string
    status: string
    title: string
}

function getRetryAmount (options: RestRetries, status: number | null): number {
    if (status == null) {
        return <number>DefaultRestOptions.retries
    } else if (typeof options === 'number') {
        return status >= 500 ? options : 0
    } else {
        const option = options.find(({ status: optionStatus }) => {
            return typeof optionStatus === 'number'
                ? optionStatus === status
                : optionStatus[0] <= status && optionStatus[1] >= status
        })

        return option?.retries ?? 0
    }
}

async function parseResponse <Parsed = unknown>(response: RestResponse) {
    return await response.json() as Promise<Parsed>
}

class PatreonError extends Error implements PatreonErrorData {
    public id: string
    public code: number
    public code_name: string
    public detail: string
    public status: string
    public title: string

    public constructor (
        error: PatreonErrorData,
        public data: PatreonHeadersData,
    ) {
        super(error.title)

        this.id = error.id
        this.code = error.code;
        this.code_name = error.code_name;
        this.detail = error.detail;
        this.status = error.status;
        this.title = error.title;
    }

    public override get name () {
        return `${this.code_name}[${this.code}]`
    }
}

export class RestClient {
    public readonly options: RESTOptions;

    public constructor (
        options: Partial<RESTOptions> = {},
    ) {
        this.options = {
            ...DefaultRestOptions,
            ...options,
        }

        // TODO: improve check
        this.options.fetch ??= DefaultRestOptions.fetch
        if (this.options.fetch == undefined) {
            throw new Error('No global fetch function found. Specify options.fetch with your fetch function')
        }
    }

    public get userAgent (): string {
        const userAgentAppendix = VERSION + (this.options.userAgentAppendix?.length ? `, ${this.options.userAgentAppendix}` : '')

        return `PatreonBot patreon-api.ts (https://github.com/ghostrider-05/patreon-api.ts, ${userAgentAppendix})`
    }

    public async get (path: string, options?: RequestOptions) {
        return await this.request({ ...options, method: RequestMethod.Get, path })
    }

    public async patch (path: string, options?: RequestOptions) {
        return await this.request({ ...options, method: RequestMethod.Patch, path })
    }

    public async post (path: string, options?: RequestOptions) {
        return await this.request({ ...options, method: RequestMethod.Post, path })
    }

    public async request <Parsed = unknown>(options: InternalRequestOptions) {
        const tryRequest = async (retries = 0): Promise<RestResponse> => {
            const response = await this.makeRequest({
                ...options,
                currentRetries: retries,
            })

            if (response instanceof Error) {
                throw response
            } else if (response == null) {
                return await tryRequest(++retries)
            } else {
                if (response.status === 429) {
                    // TODO: How should libraries handle 429??
                    throw new Error('This client is currently ratelimited. Please contact Patreon or reduce your requests')
                }

                if (response.ok) {
                    return response
                } else if (this.shouldRetry(retries, response.status)) {
                    // Retry with updated access token
                    if ([401].includes(response.status)) {
                        const updatedToken = await this.options.getAccessToken()

                        if (updatedToken) options.accessToken = updatedToken
                    }

                    return await tryRequest(++retries)
                } else {
                    // Invalid request, but not retried
                    const errors = await parseResponse<{ errors: PatreonErrorData[] }>(response)

                    // TODO: can there more than 1 error?
                    throw new PatreonError(errors.errors[0], this.getHeaders(response))
                }
            }
        }

        return await tryRequest()
            .then(res => parseResponse<Parsed>(res))
    }

    private async makeRequest (options: InternalRequestOptions & { currentRetries: number }) {
        // copied from @discordjs/rest
        const controller = new AbortController();
	    const timeout = setTimeout(() => controller.abort(), options.timeout ?? 15_000);

        if (options.signal) {
            if (options.signal.aborted) controller.abort();
            else options.signal.addEventListener('abort', () => controller.abort());
        }

        const fetchAPI = this.buildRequest(options)

        let res: RestResponse;

        try {
            res = await fetchAPI()
        } catch (error: unknown) {
            if (!(error instanceof Error)) throw error;

            if (this.shouldRetry(options.currentRetries, null, error)) {
                return null
            }

            return error
        } finally {
            clearTimeout(timeout)
        }

        return res;
    }

    private buildRequest (options: InternalRequestOptions) {
        const route = options.route != undefined
            ? options.route
            : this.options.api + options.path
        const url = route + (options.query ?? '')

        const defaultHeaders = {
            'Content-Type': 'application/json',
            'User-Agent': this.userAgent,
        }

        if (options.auth ?? true) {
            if (!options.accessToken) throw new Error('Missing access token for authenticated request')

            const prefix = (options.authPrefix ?? this.options.authPrefix) + ' '
            defaultHeaders['Authorization'] = prefix + options.accessToken
        }

        return async () => await (options.fetch ?? this.options.fetch)(url, {
            headers: {
                ...defaultHeaders,
                ...this.options.headers,
                ...(options.headers ?? {}),
            },
            method: options.method,
            body: [RequestMethod.Get].includes(options.method)
                ? options.body ?? null
                : null,
            signal: options.signal!,
        })
    }

    private shouldRetry (current: number, status: number | null, error?: Error): boolean {
        const amount = getRetryAmount(this.options.retries, status)

        if (error) {
            const shouldRetry = error.name === 'AbortError'
                || (('code' in error && error.code === 'ECONNRESET') || error.message.includes('ECONNRESET'))

            return shouldRetry && amount !== current
        }

        return amount !== current
    }

    public getHeaders (response: RestResponse): PatreonHeadersData {
        return {
            sha: response.headers.get(PATREON_RESPONSE_HEADERS.Sha),
            uuid: response.headers.get(PATREON_RESPONSE_HEADERS.UUID),
        }
    }
}
