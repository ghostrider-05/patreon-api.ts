import {
    isValidErrorBody,
    PatreonError,
    type PatreonErrorData,
} from './error'

import {
    getHeaders,
    makeUserAgentHeader,
} from './headers'

import {
    DefaultRestOptions,
    RequestMethod,
    type RequestOptions,
    type RestClientOptions,
    type RestResponse,
} from './options'

import {
    getRetryAmount,
    type InternalRetryData,
} from './retries'

import {
    sleep,
    RequestCounter,
    type RestRequestCounter,
    type RestRequestCounterOptions,
} from './internal/counter'

import { RatelimitManager } from './internal/ratelimit'

// eslint-disable-next-line jsdoc/require-jsdoc
async function parseResponse <Parsed = unknown>(response: RestResponse): Promise<Parsed> {
    // Can also be checked with the content-type response header.
    // Add that as an improvement in the future
    // if the Patreon API can return something else than JSON.

    const body = await response.text()
    // For an empty body, e.g. for a 204 response, return the body
    if (body.length === 0) return body as Parsed

    try {
        return JSON.parse(body) as Parsed
    } catch {
        return body as Parsed
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
function isMissingAuthorization (status: number): boolean {
    return [401].includes(status)
}

// eslint-disable-next-line jsdoc/require-returns
/**
 * Check if the request should include a body on the request using the request method
 * @param method The method of the request to check
 */
export function shouldIncludeRequestBody (method: RequestMethod | `${RequestMethod}`): boolean {
    const methods: (RequestMethod | `${RequestMethod}`)[] = [
        RequestMethod.Patch,
        RequestMethod.Post,
    ]

    return methods.includes(method)
}

interface PatreonErrorResponseBody {
    errors: PatreonErrorData[]
}

interface SharedRequestOptions extends RequestOptions {
    method: RequestMethod | `${RequestMethod}`
    url: string
    currentRetries: number
}

export type {
    RestRequestCounter,
    RestRequestCounterOptions,
}

export class RestClient {
    public readonly options: RestClientOptions
    public name: string | null

    private ratelimiter: RatelimitManager
    private counter: RequestCounter
    private invalidCounter: RequestCounter

    public constructor (
        options: Partial<RestClientOptions> = {},
        client: {
            name: string | null
        } = { name: null },
    ) {
        this.name = client.name
        this.options = {
            ...DefaultRestOptions,
            ...options,
        }

        if (options.fetch == undefined && fetch == undefined) {
            throw new Error('No global fetch function found. Specify options.fetch with your fetch function')
        }

        const { globalRequestsLimit, globalRequestPerSecond, invalidRequestsLimit } = this.options
        const requestLimitOptions = (typeof globalRequestsLimit === 'number' ? globalRequestsLimit : globalRequestsLimit.amount) <= 0
            ? globalRequestPerSecond
            : globalRequestsLimit

        this.ratelimiter = new RatelimitManager()
        this.counter = new RequestCounter(requestLimitOptions, () => true)
        this.invalidCounter = new RequestCounter(invalidRequestsLimit, (_url, { status }) => {
            return status >= 400 && status < 500
        })
    }

    public get userAgent (): string {
        return makeUserAgentHeader(this.name ?? RestClient.defaultClientName, this.options.userAgentAppendix)
    }

    public get limited (): boolean {
        return this.ratelimiter.limited
            || this.counter.limited
            || this.invalidCounter.limited
    }

    public get requestCounter (): RestRequestCounter {
        return this.counter
    }

    public get invalidRequestCounter (): RestRequestCounter {
        return this.invalidCounter
    }

    public clearRatelimitTimeout (): void {
        this.ratelimiter.clear()
    }

    public debug (message: string): void {
        const emitted = this.options.emitter?.emit('debug', { message }) ?? false

        if (!emitted && this.options.debug) {
            console.log(message)
        }
    }

    public async delete<T> (path: string, options?: RequestOptions): Promise<T> {
        return await this.request<T>(path, RequestMethod.Delete, options)
    }

    public async get<T> (path: string, options?: RequestOptions): Promise<T> {
        return await this.request<T>(path, RequestMethod.Get, options)
    }

    public async patch<T> (path: string, options?: RequestOptions): Promise<T> {
        return await this.request<T>(path, RequestMethod.Patch, options)
    }

    public async post<T> (path: string, options?: RequestOptions): Promise<T> {
        return await this.request<T>(path, RequestMethod.Post, options)
    }

    public async request <TypedResponse = unknown>(
        path: string,
        method: RequestMethod | `${RequestMethod}`,
        options: RequestOptions = {}
    ): Promise<TypedResponse> {
        const tryRequest = async (retries = 0): Promise<RestResponse> => {
            const url = this.buildUrl(path, options)
            const response = await this.makeRequest({
                ...options,
                method,
                url,
                currentRetries: retries,
            })

            if (response instanceof Error) {
                throw response
            } else if (response == null) {
                return await tryRequest(++retries)
            } else {
                const counterOptions = { method, status: response.status }
                if (this.counter.filter(url, counterOptions)) {
                    this.counter.add()
                }

                if (this.invalidCounter.filter(url, counterOptions)) {
                    this.invalidCounter.add()
                }

                if (response.ok) {
                    return response
                }

                const retryInvalidRequestResult = await this.handleInvalidRequest(
                    response,
                    retries,
                    path,
                    options
                )

                // Check for true value specific
                if (retryInvalidRequestResult === true) {
                    // Retry with updated access token
                    if (isMissingAuthorization(response.status)) {
                        const updatedToken = await this.options.getAccessToken()

                        if (updatedToken) options.accessToken = updatedToken
                    }

                    return await tryRequest(++retries)
                } else {
                    throw retryInvalidRequestResult
                }
            }
        }

        const response = await tryRequest()
        const parsed = parseResponse<TypedResponse>(response)

        this.options.emitter?.emit('response', {
            data: getHeaders(response.headers),
            bodyUsed: response.bodyUsed,
            response,
            headers: response.headers,
            ok: response.ok,
            status: response.status,
        })

        return parsed
    }

    private async makeRequest (options: SharedRequestOptions) {
        const waited = await this.ratelimiter.wait()
        if (waited > 0) {
            this.debug('This client is queueing a request to avoid ratelimits')
        }

        await this.counter.wait()
        await this.invalidCounter.wait()

        // Timeout and abort options
        const signal = AbortSignal.any([
            options.signal,
            AbortSignal.timeout(options.timeout ?? this.options.timeout),
        ].filter(s => s != undefined))

        const headers = this.getHeaders(options)
        const body = shouldIncludeRequestBody(<RequestMethod>options.method)
            ? options.body ?? null
            : null

        this.options.emitter?.emit('request', {
            body,
            headers,
            url: options.url,
            method: options.method,
        })

        try {
            const fetcher = options.fetch ?? this.options.fetch
            const init = {
                body,
                headers,
                method: options.method,
                signal,
            } satisfies RequestInit

            signal.throwIfAborted()
            return await fetcher(options.url, init)
        } catch (error) {
            if (!(error instanceof Error)) throw new Error(JSON.stringify(error))

            const data = this.getRetryData(options.currentRetries, null, error)
            if (data != null) {
                return null
            }

            return error
        }
    }

    private getHeaders (options: Pick<RequestOptions, 'headers' | 'accessToken' | 'auth' | 'authPrefix'>) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'User-Agent': this.userAgent,
        }

        if (options.auth ?? true) {
            if (!options.accessToken) throw new Error('Missing access token for authenticated request')

            const prefix = (options.authPrefix ?? this.options.authPrefix) + ' '
            defaultHeaders['Authorization'] = prefix + options.accessToken
        }

        return {
            ...defaultHeaders,
            ...this.options.headers,
            ...(options.headers ?? {}),
        }
    }

    private buildUrl (path: string, options: Pick<RequestOptions, 'route' | 'query' | 'api'>): string {
        const route = options.route != undefined
            ? options.route
            : (options.api ?? this.options.api) + path

        return route + (options.query ?? '')
    }

    // eslint-disable-next-line jsdoc/require-param
    /**
     * @returns A boolean if it should be retried or the errors to throw
     */
    private async handleInvalidRequest (
        response: RestResponse,
        retries: number,
        path: string,
        options: RequestOptions,
    ): Promise<true | PatreonError[]> {
        let errors: PatreonErrorData[] | null = null

        if (response.status === 429) {
            const parsed = await this.handleRatelimit(response)
            if (parsed != null) errors = parsed.errors

            this.options.emitter?.emit('ratelimit', {
                url: this.buildUrl(path, options),
                timeout: this.options.ratelimitTimeout,
            })
        }

        const data = this.getRetryData(retries, response.status)
        if (data != null) {
            await sleep(data.backoff(retries))

            return true
        } else {
            // Invalid request, but not retried
            if (errors == null) {
                const body = await parseResponse<PatreonErrorResponseBody>(response)

                if (isValidErrorBody(body)) {
                    errors = body.errors
                } else {
                    throw new Error('Received an invalid error response:\n' + JSON.stringify(body))
                }
            }

            return errors.map(error => {
                return new PatreonError(error, getHeaders(response.headers))
            })
        }
    }

    private getRetryData (current: number, status: number | null, error?: Error): InternalRetryData | null {
        const data = getRetryAmount(this.options.retries, status)

        if (error) {
            const shouldRetry = error.name === 'AbortError'
                || error.name === 'TimeoutError'
                || (('code' in error && error.code === 'ECONNRESET') || error.message.includes('ECONNRESET'))

            return (shouldRetry && current < data.retries) ? data : null
        }

        return (current < data.retries) ? data : null
    }

    private async handleRatelimit (response: RestResponse): Promise<PatreonErrorResponseBody | null> {
        const timeout = this.options.ratelimitTimeout
        const headers = getHeaders(response.headers)

        this.debug('This client is currently ratelimited. Please contact Patreon or reduce your requests')

        if (headers.retryafter != null) {
            const until = this.ratelimiter.applyTimeout(headers.retryafter, timeout)
            this.debug('This client is ratelimited until: ' + (until?.toISOString() ?? 'no retry time found'))

            return null
        }

        this.debug('Missing retry after header for ratelimited response, parsing request body')

        const body = await parseResponse<PatreonErrorResponseBody>(response)
        if (!isValidErrorBody(body)) return null

        const until = this.ratelimiter.applyTimeout(body.errors.at(0)?.retry_after_seconds, timeout)
        this.debug('This client is ratelimited until: ' + (until?.toISOString() ?? 'no retry time found'))

        return body
    }

    protected static defaultClientName = 'PatreonBot'

    protected static get defaultUserAgent (): string {
        return makeUserAgentHeader(RestClient.defaultClientName)
    }
}
