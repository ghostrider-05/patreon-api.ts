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
    type RESTOptions,
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
} from './internal/counter'

// eslint-disable-next-line jsdoc/require-jsdoc
async function parseResponse <Parsed = unknown>(response: RestResponse): Promise<Parsed> {
    // Can also be checked with the content-type response header.
    // Add that as an improvement in the future
    // if the Patreon API can return something else than JSON.
    try {
        return await response.json() as Promise<Parsed>
    } catch {
        // Response is not JSON, so parse the body as a string and throw the response as an error
        // It is likely HTML of the client being blocked or another error
        const body = await response.text()
        // For an empty body, e.g. for a 204 response, return null
        if (body.length === 0) return null as Parsed
        throw new Error(body)
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
function isMissingAuthorization (status: number) {
    return [401].includes(status)
}

// eslint-disable-next-line jsdoc/require-returns
/**
 * Check if the request should include a body on the request using the request method
 * @param method The method of the request to check
 */
export function shouldIncludeRequestBody (method: RequestMethod): boolean {
    return [
        RequestMethod.Patch,
        RequestMethod.Post,
    ].includes(method)
}

interface PatreonErrorResponseBody {
    errors: PatreonErrorData[]
}

export interface InternalClientSharedOptions {
    name: string | null
}

interface SharedRequestOptions extends RequestOptions {
    method?: RequestMethod | `${RequestMethod}`
}

export class RestClient {
    public readonly options: RESTOptions
    public name: string | null

    private ratelimitedUntil: Date | null = null
    private counter: RequestCounter
    private invalidCounter: RequestCounter

    public constructor (
        options: Partial<RESTOptions> = {},
        client: InternalClientSharedOptions,
    ) {
        this.options = {
            ...DefaultRestOptions,
            ...options,
        }

        if (options.fetch == undefined && fetch == undefined) {
            throw new Error('No global fetch function found. Specify options.fetch with your fetch function')
        }

        this.counter = new RequestCounter(
            this.options.globalRequestPerSecond,
        )
        this.invalidCounter = new RequestCounter(
            this.options.invalidRequestsLimit,
        )

        this.name = client.name
    }

    public get userAgent (): string {
        return makeUserAgentHeader(this.name ?? RestClient.defaultClientName, this.options.userAgentAppendix)
    }

    public get limited (): boolean {
        return this.ratelimitedUntil != null || this.counter.limited
    }

    public get requestCounter (): RestRequestCounter {
        return this.counter
    }

    public get invalidRequestCounter (): RestRequestCounter {
        return this.invalidCounter
    }

    public async delete<T> (path: string, options?: RequestOptions) {
        return await this.request<T>(path, RequestMethod.Delete, options)
    }

    public async get<T> (path: string, options?: RequestOptions) {
        return await this.request<T>(path, RequestMethod.Get, options)
    }

    public async patch<T> (path: string, options?: RequestOptions) {
        return await this.request<T>(path, RequestMethod.Patch, options)
    }

    public async post<T> (path: string, options?: RequestOptions) {
        return await this.request<T>(path, RequestMethod.Post, options)
    }

    public async request <TypedResponse = unknown>(
        path: string,
        method: RequestMethod | `${RequestMethod}`,
        options: RequestOptions = {}
    ): Promise<TypedResponse> {
        const tryRequest = async (retries = 0): Promise<RestResponse> => {
            const response = await this.makeRequest({
                ...options,
                method,
                path,
                currentRetries: retries,
            })

            if (response instanceof Error) {
                throw response
            } else if (response == null) {
                return await tryRequest(++retries)
            } else {
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

        if (this.options.emitter?.listenerCount('response')) {
            this.options.emitter.emit('response', {
                data: getHeaders(response.headers),
                bodyUsed: response.bodyUsed,
                response,
                headers: response.headers,
                ok: response.ok,
                status: response.status,
            })
        }

        return parsed
    }

    private async makeRequest (options: SharedRequestOptions & { path: string, currentRetries: number }) {
        await this.waitForRatelimit()

        await this.counter.wait()
        await this.invalidCounter.wait()

        this.counter.add()

        // copied from @discordjs/rest
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), options.timeout ?? this.options.timeout)

        if (options.signal) {
            if (options.signal.aborted) controller.abort()
            else options.signal.addEventListener('abort', () => controller.abort())
        }

        const init = this.buildRequest(options), url = this.buildUrl(options.path, options)
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

            const data = this.getRetryData(options.currentRetries, null, error)
            if (data != null) {
                return null
            }

            return error
        } finally {
            clearTimeout(timeout)
        }

        return res
    }

    private buildUrl (path: string, options: Pick<RequestOptions, 'route' | 'query'>): string {
        const route = options.route != undefined
            ? options.route
            : this.options.api + path

        return route + (options.query ?? '')
    }

    private buildRequest (options: SharedRequestOptions) {
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
            body: shouldIncludeRequestBody(method)
                ? options.body ?? null
                : null,
            // AbortSignal | undefined is not a possible type...
            signal: <AbortSignal>options.signal,
        }
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

        if (response.status >= 400 && response.status < 500) {
            this.invalidCounter.add()
        }

        if (response.status === 429) {
            const parsed = await this.handleRatelimit(response)
            if (parsed != null) errors = parsed.errors

            if (this.options.emitter?.listenerCount('ratelimit')) {
                this.options.emitter.emit('ratelimit', {
                    url: this.buildUrl(path, options),
                    timeout: this.options.ratelimitTimeout,
                })
            }
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
                || (('code' in error && error.code === 'ECONNRESET') || error.message.includes('ECONNRESET'))

            return (shouldRetry && current < data.retries) ? data : null
        }

        return (current < data.retries) ? data : null
    }

    private async waitForRatelimit (): Promise<number> {
        if (this.ratelimitedUntil == null) return 0

        console.log('This client is queueing a request to avoid ratelimits')
        const offset = Date.now() - this.ratelimitedUntil.getTime()

        await sleep(offset)
        this.ratelimitedUntil = null

        return offset
    }

    private async handleRatelimit (response: RestResponse) {
        const timeout = this.options.ratelimitTimeout
        const headers = getHeaders(response.headers)

        console.log('This client is currently ratelimited. Please contact Patreon or reduce your requests', headers)

        if (headers.retryafter != null) {
            const RetryAfter = parseInt(headers.retryafter) * 1000

            if ((RetryAfter + timeout) > 0) {
                this.ratelimitedUntil = new Date(Date.now() + RetryAfter + timeout)
            }

            return null
        } else {
            console.warn('Missing retry after header for ratelimited response, parsing request body')

            const body = await parseResponse<PatreonErrorResponseBody>(response)
            if (isValidErrorBody(body)) {
                const retry_after_seconds = body.errors.at(0)?.retry_after_seconds ?? 0

                if (retry_after_seconds === 0) {
                    console.warn('No retry_after_seconds found in the response body. Not applying rate limit retry timeout')
                }

                if ((retry_after_seconds + timeout) > 0) {
                    this.ratelimitedUntil = new Date(Date.now() + (retry_after_seconds * 1000) + timeout)
                }

                return body
            }

            return null
        }
    }

    protected static defaultClientName = 'PatreonBot'

    protected static get defaultUserAgent (): string {
        return makeUserAgentHeader(RestClient.defaultClientName)
    }
}
