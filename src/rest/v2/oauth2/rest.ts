import { VERSION } from '../../../utils'
import { RouteBases } from '../routes'

export type RestResponse = Pick<Response,
    | 'body'
    | 'arrayBuffer'
    | 'bodyUsed'
    | 'headers'
    | 'json'
    | 'ok'
    | 'status'
    | 'statusText'
    | 'text'
>

export type RestFetcher = (url: string, init: RequestInit) => Promise<RestResponse>

export interface RestRetriesBackoffOptions {
    /**
     * The time (in ms) to wait between a retried request.
     * Combined with the strategy it will result in a final backoff time.
     */
    time: number

    /**
     * The maximum time (in ms) to add to each backoff.
     * Will be pseudorandom number between 0 and jitter.
     */
    jitter?: number

    /**
     * The strategy to use.
     * - linear: (retries * time)
     * - exponential: (retries * retries * time)
     * - custom
     */
    strategy:
        | 'linear'
        | 'exponential'
        | ((retries: number, backoff: number) => number)

    /**
     * The maximum time (in ms) the backoff can be (excluding jitter)
     */
    limit?: number
}

export interface RestRetriesOptions {
    retries: number
    backoff?: RestRetriesBackoffOptions
}

export type RestRetries =
    | number
    | RestRetriesOptions
    | ({ status: [number, number] | number } & RestRetriesOptions)[]

export interface RestEventMap {
    request: [data: {
        url: string
        headers: Record<string, unknown>
        method: string
        body: string | null
    }]
    response: [data: {
        data: PatreonHeadersData
        response: RestResponse
    } & Pick<RestResponse,
        | 'bodyUsed'
        | 'headers'
        | 'ok'
        | 'status'
        | 'statusText'
    >]
    ratelimit: [data: {
        url: string
        timeout: number
    }]
}

export interface RESTOptions<IncludeAllQuery extends boolean = boolean> {
    /**
     * The base url of the Patreon API
     * @default 'https://patreon.com/api/oauth/v2'
     */
    api: string

    /**
     * The prefix of the Authorization header
     * @default 'Bearer'
     */
    authPrefix: string

    /**
     * The event emitter to use for emitting data for:
     * - response
     * - request
     * - ratelimit
     * @default null
     */
    emitter: NodeJS.EventEmitter<RestEventMap> | null

    /**
     * The fetch function to use for making requests
     * @default globalThis.fetch
     */
    fetch: RestFetcher

    /**
     * Get the access token for unauthenticated requests
     * @default <Client>.fetchStoredToken
     */
    getAccessToken: () => Promise<string | undefined>

    /**
     * Headers to add on every request
     * @default {}
     */
    headers: Record<string, string>

    /**
     * The amount of times to retry failed (defaults to 5XX responses) or aborted requests.
     *
     * Can be applied to all statuses, ranges or a specific status.
     * @default 3
     */
    retries: RestRetries

    /**
     * Whether to include all relationships and attributes in the query
     * @default false
     */
    includeAllQueries: IncludeAllQuery

    /**
     * The time in ms after the request will be aborted.
     * Can also be overwritten on the request options.
     * @default 15_000
     */
    timeout: number

    /**
     * The time in ms after a request is rate limited to wait before sending new requests
     * @default 0
     */
    ratelimitTimeout: number

    // TODO: check what a good limit is before being ratelimited.
    /**
     * The maximum amount of requests per second for this client.
     * Set to `0` to disable the limit.
     * @default 0
     */
    globalRequestPerSecond: number

    /**
     * The string to append to the user agent header
     */
    userAgentAppendix: string | undefined
}

export interface RequestOptions {
    /**
     * The base url of the Patreon API
     * @default {@link RESTOptions.api}
     */
    api?: string

    /**
     * Replace the api base, path and query with a different route
     * @default undefined
     */
    route?: string

    /**
     * The final query string
     * @default ''
     */
    query?: string

    /**
     * Whether this request should include an authorization header
     * @default true
     */
    auth?: boolean

    /**
     * The authentication prefix for this request to use
     * @default 'Bearer'
     */
    authPrefix?: string

    /**
     * For authenticated requests, the token to use.
     * @default undefined
     * @throws if the request is authenticated but no token is given
     */
    accessToken?: string | undefined

    /**
     * The stringified request body
     * @default undefined
     */
    body?: string | undefined

    /**
     * Headers to add on this request
     * @default {}
     */
    headers?: Record<string, string>

    /**
     * The time in ms after the request will be aborted
     * @default 15_000
     */
    timeout?: number

    /**
     * The fetch function to use for making this request
     * @default globalThis.fetch
     */
    fetch?: RestFetcher | undefined

    /**
     * The abort signal for this request
     * @default undefined
     */
    signal?: AbortSignal | undefined
}

export const ResponseHeaders = {
    Sha: 'x-patreon-sha',
    UUID: 'x-patreon-uuid',
    CfCacheStatus: 'cf-cache-status',
    CfRay: 'cf-ray',
    RetryAfter: 'Retry-After',
} as const

/** @deprecated */
export const PATREON_RESPONSE_HEADERS = ResponseHeaders

export const DefaultRestOptions: RESTOptions = {
    authPrefix: 'Bearer',
    api: RouteBases.oauth2,
    emitter: null,
    includeAllQueries: false,
    fetch: (...args) => fetch(...args),
    getAccessToken: async () => undefined,
    globalRequestPerSecond: 0,
    ratelimitTimeout: 0,
    // Set to number for the typecast to be correct
    retries: 3,
    timeout: 15_000,
    headers: {},
    userAgentAppendix: '',
}

export enum RequestMethod {
    Delete = 'DELETE',
    Get = 'GET',
    Patch = 'PATCH',
    Post = 'POST',
}

export type PatreonHeadersData = Record<Lowercase<keyof typeof ResponseHeaders>, string | null>

export interface InternalRequestOptions extends RequestOptions {
    path: string
    method?: RequestMethod | `${RequestMethod}`
}

export interface PatreonErrorData {
    id: string
    code_challenge: null
    code: number | null
    code_name: string
    detail: string
    status: string
    title: string
    retry_after_seconds?: number
    source?: {
        parameter?: string
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
async function sleep (ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

interface InternalRetryData {
    retries: number
    backoff: (current: number) => number
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function createBackoff (options: RestRetriesBackoffOptions) {
    return (currentRetries: number) => {
        const { strategy, time, limit } = options
        const jitter = options.jitter ? (Math.random() * options.jitter) : 0

        if (strategy === 'linear') {
            return Math.max(limit ?? 0, time * currentRetries) + jitter
        } else if (strategy === 'exponential') {
            return Math.max(limit ?? 0, time * (currentRetries * currentRetries)) + jitter
        } else {
            return Math.max(limit ?? 0, strategy(currentRetries, time)) + jitter
        }
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
function isRetryable (status: number | null) {
    return status == null || status >= 500
}

// eslint-disable-next-line jsdoc/require-jsdoc
function isMissingAuthorization (status: number) {
    return [401].includes(status)
}

/**
 * Get the amount to retry the failed request
 * @param options the client options for retrying requests
 * @param status The response status. `null` if no response is assiocated
 * @returns the final retry options
 */
function getRetryAmount (options: RestRetries, status: number | null): InternalRetryData {
    const defaultRetries = DefaultRestOptions.retries as number
    const createRetryOptions = (retries: number, backoff?: RestRetriesBackoffOptions): InternalRetryData => ({
        retries: isRetryable(status) ? retries : 0,
        backoff: backoff ? createBackoff(backoff) : (() => 0),
    })

    if (typeof options === 'number') {
        return createRetryOptions(options)
    } else if (Array.isArray(options)) {
        if (status == null) return createRetryOptions(defaultRetries)

        const option = options.find(({ status: optionStatus }) => {
            return typeof optionStatus === 'number'
                ? optionStatus === status
                : optionStatus[0] <= status && optionStatus[1] >= status
        })

        if (!option) return createRetryOptions(defaultRetries)
        return createRetryOptions(option.retries, option.backoff)
    } else {
        return createRetryOptions(options.retries, options.backoff)
    }
}

/**
 * Parse a response from Patreon
 * @param response the REST response
 * @returns the parsed body
 */
async function parseResponse <Parsed = unknown>(response: RestResponse) {
    return await response.json() as Promise<Parsed>
}

class PatreonError extends Error {
    public constructor (
        public error: PatreonErrorData,
        public data: PatreonHeadersData,
    ) {
        super(error.title)

    }

    public get retry_after_seconds () {
        return this.error.retry_after_seconds ?? 0
    }

    public override get name () {
        return `${this.error.code_name}[${this.error.code ?? 'unknown code'}]`
    }
}

export class RestClient {
    private static readonly INTERVAL_MS = 1000

    public readonly options: RESTOptions
    public name: string | null = null

    private ratelimitedUntil: Date | null = null

    private requestsCounts: number | null = null
    private requestInterval: NodeJS.Timeout | undefined = undefined

    public constructor (
        options: Partial<RESTOptions> = {},
    ) {
        this.options = {
            ...DefaultRestOptions,
            ...options,
        }

        if (options.fetch == undefined && fetch == undefined) {
            throw new Error('No global fetch function found. Specify options.fetch with your fetch function')
        }
    }

    private initializeRequestInterval () {
        if (this.requestInterval != null) return
        this.requestInterval = setInterval(() => {
            this.requestsCounts = 0
        }, RestClient.INTERVAL_MS)

        this.requestInterval.unref()
    }

    public get userAgent (): string {
        const userAgentAppendix = VERSION + (this.options.userAgentAppendix?.length ? `, ${this.options.userAgentAppendix}` : '')

        return `${this.name ?? 'PatreonBot'} patreon-api.ts (https://github.com/ghostrider-05/patreon-api.ts, ${userAgentAppendix})`
    }

    public get limited (): boolean {
        return this.ratelimitedUntil != null
            || (this.requestsCounts != null && this.requestsCounts > this.options.globalRequestPerSecond)
    }

    public clearRequestInterval (): void {
        clearInterval(this.requestInterval)
    }

    public async delete<T> (path: string, options?: RequestOptions) {
        return await this.request<T>({ ...options, method: RequestMethod.Delete, path })
    }

    public async get<T> (path: string, options?: RequestOptions) {
        return await this.request<T>({ ...options, method: RequestMethod.Get, path })
    }

    public async patch<T> (path: string, options?: RequestOptions) {
        return await this.request<T>({ ...options, method: RequestMethod.Patch, path })
    }

    public async post<T> (path: string, options?: RequestOptions) {
        return await this.request<T>({ ...options, method: RequestMethod.Post, path })
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
                    this.handleRatelimit(response)

                    if (this.options.emitter?.listenerCount('ratelimit')) {
                        this.options.emitter.emit('ratelimit', {
                            url: this.buildUrl(options),
                            timeout: this.options.ratelimitTimeout,
                        })
                    }

                    const data = this.shouldRetry(retries, 429)
                    if (data != null) {
                        await sleep(data.backoff(retries))
                        return tryRequest(++retries)
                    }
                }

                if (response.ok) {
                    return response
                }

                const data = this.shouldRetry(retries, response.status)
                if (data != null) {
                    await sleep(data.backoff(retries))

                    // Retry with updated access token
                    if (isMissingAuthorization(response.status)) {
                        const updatedToken = await this.options.getAccessToken()

                        if (updatedToken) options.accessToken = updatedToken
                    }

                    return await tryRequest(++retries)
                } else {
                    // Invalid request, but not retried
                    const errors = await parseResponse<{ errors: PatreonErrorData[] }>(response)

                    throw errors.errors.map(error => {
                        return new PatreonError(error, this.getHeaders(response))
                    })
                }
            }
        }

        const response = await tryRequest()
        const parsed = parseResponse<Parsed>(response)

        if (this.options.emitter?.listenerCount('response')) {
            this.options.emitter.emit('response', {
                data: this.getHeaders(response),
                bodyUsed: response.bodyUsed,
                response,
                headers: response.headers,
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
            })
        }

        return parsed
    }

    private async makeRequest (options: InternalRequestOptions & { currentRetries: number }) {
        await this.waitForRatelimit()
        await this.waitForRequestLimit()

        // copied from @discordjs/rest
        const controller = new AbortController()
	    const timeout = setTimeout(() => controller.abort(), options.timeout ?? this.options.timeout)

        if (options.signal) {
            if (options.signal.aborted) controller.abort()
            else options.signal.addEventListener('abort', () => controller.abort())
        }

        const init = this.buildRequest(options), url = this.buildUrl(options)
        const fetchAPI = async () => await (options.fetch ?? this.options.fetch)(url, init)

        if (this.options.emitter?.listenerCount('request')) {
            this.options.emitter.emit('request', {
                headers: init.headers,
                url,
                method: init.method,
                body: init.body,
            })
        }

        let res: RestResponse

        try {
            res = await fetchAPI()
        } catch (error) {
            if (!(error instanceof Error)) throw new Error(JSON.stringify(error))

            const data = this.shouldRetry(options.currentRetries, null, error)
            if (data != null) {
                return null
            }

            return error
        } finally {
            clearTimeout(timeout)
        }

        return res
    }

    private buildUrl (options: InternalRequestOptions): string {
        const route = options.route != undefined
            ? options.route
            : this.options.api + options.path

        return route + (options.query ?? '')
    }

    private buildRequest (options: InternalRequestOptions) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'User-Agent': this.userAgent,
        }

        if (options.auth ?? true) {
            if (!options.accessToken) throw new Error('Missing access token for authenticated request')

            const prefix = (options.authPrefix ?? this.options.authPrefix) + ' '
            defaultHeaders['Authorization'] = prefix + options.accessToken
        }

        const method = <RequestMethod>(options.method ?? RequestMethod.Get)

        return {
            headers: {
                ...defaultHeaders,
                ...this.options.headers,
                ...(options.headers ?? {}),
            },
            method,
            body: ![RequestMethod.Get].includes(method)
                ? options.body ?? null
                : null,
            // AbortSignal | undefined is not a possible type...
            signal: <AbortSignal>options.signal,
        }
    }

    private shouldRetry (current: number, status: number | null, error?: Error): InternalRetryData | null {
        const data = getRetryAmount(this.options.retries, status)

        if (error) {
            const shouldRetry = error.name === 'AbortError'
                || (('code' in error && error.code === 'ECONNRESET') || error.message.includes('ECONNRESET'))

            return (shouldRetry && current < data.retries) ? data : null
        }

        return (current < data.retries) ? data : null
    }

    private async waitForRequestLimit (): Promise<void> {
        const limit = this.options.globalRequestPerSecond
        if (limit <= 0) return

        this.requestsCounts ??= 0
        if (this.requestsCounts >= limit) {
            await sleep(RestClient.INTERVAL_MS)
        }

        this.requestsCounts += 1
        this.initializeRequestInterval()
    }

    private async waitForRatelimit (): Promise<number> {
        if (this.ratelimitedUntil == null) return 0

        console.log('This client is queueing a request to avoid ratelimits')
        const offset = Date.now() - this.ratelimitedUntil.getTime()

        await sleep(offset)
        this.ratelimitedUntil = null

        return offset
    }

    private handleRatelimit (response: RestResponse) {
        const headers = this.getHeaders(response)
        console.log('This client is currently ratelimited. Please contact Patreon or reduce your requests', headers)

        if (!headers.retryafter) {
            console.warn('Missing retry after header for ratelimited response!')
        }

        const RetryAfter = (headers.retryafter ? parseInt(headers.retryafter) : 0) * 1000
        const timeout = this.options.ratelimitTimeout

        if ((RetryAfter + timeout) > 0) {
            this.ratelimitedUntil = new Date(Date.now() + RetryAfter + timeout)
        }
    }

    /**
     * Get Patreon headers from a response
     * @param response the response from Patreon
     * @returns the extracted headers
     */
    public getHeaders (response: RestResponse): PatreonHeadersData {
        return {
            sha: response.headers.get(ResponseHeaders.Sha),
            uuid: response.headers.get(ResponseHeaders.UUID),
            cfcachestatus: response.headers.get(ResponseHeaders.CfCacheStatus),
            cfray: response.headers.get(ResponseHeaders.CfRay),
            retryafter: response.headers.get(ResponseHeaders.RetryAfter),
        }
    }
}
