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
    type InternalRequestOptions,
    RequestMethod,
    type RequestOptions,
    type RESTOptions,
    type RestResponse,
} from './options'

import {
    getRetryAmount,
    type InternalRetryData,
} from './retries'

// eslint-disable-next-line jsdoc/require-jsdoc
async function parseResponse <Parsed = unknown>(response: RestResponse) {
    // Can also be checked with the content-type response header.
    // Add that as an improvement in the future
    // if the Patreon API can return something else than JSON.
    try {
        return await response.json() as Promise<Parsed>
    } catch {
        // Response is not JSON, so parse the body as a string and throw the response as an error
        // It is likely HTML of the client being blocked or another error
        const body = await response.text()
        throw new Error(body)
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
function isMissingAuthorization (status: number) {
    return [401].includes(status)
}

// eslint-disable-next-line jsdoc/require-jsdoc
async function sleep (ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

class InternalRequestCounter {
    public constructor (
        public period: number,
        public limit: number,
    ) {}

    private _count: number | null = null
    private timer: NodeJS.Timeout | undefined = undefined

    public async addRequest (): Promise<void> {
        if (this.limit <= 0) return

        if (this._count != null) {
            this._count += 1
        } else {
            this._count = 1
            this.timer = setInterval(() => {
                this._count = 0
            }, this.period).unref()
        }

        if (this._count > this.limit) {
            await sleep(this.period)
        }
    }

    public clear (): void {
        clearInterval(this.timer)
    }

    public get count() {
        return this._count
    }

    public get limited () {
        return this._count != null && this._count > this.limit
    }
}

interface PatreonErrorResponseBody {
    errors: PatreonErrorData[]
}

export interface InternalClientSharedOptions {
    name: string | null
}

export class RestClient {
    public readonly options: RESTOptions
    public name: string | null

    private ratelimitedUntil: Date | null = null
    private requestCounter: InternalRequestCounter

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

        this.requestCounter = new InternalRequestCounter(
            1000,
            this.options.globalRequestPerSecond,
        )

        this.name = client.name
    }

    protected static defaultClientName = 'PatreonBot'

    public static get defaultUserAgent (): string {
        return makeUserAgentHeader(RestClient.defaultClientName)
    }

    public get userAgent (): string {
        return makeUserAgentHeader(this.name ?? RestClient.defaultClientName, this.options.userAgentAppendix)
    }

    public get limited (): boolean {
        return this.ratelimitedUntil != null || this.requestCounter.limited
    }

    public clearRequestInterval (): void {
        this.requestCounter.clear()
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
                if (response.ok) {
                    return response
                }

                let errors: PatreonErrorData[] | null = null

                if (response.status === 429) {
                    const parsed = await this.handleRatelimit(response)
                    if (parsed != null) errors = parsed.errors

                    if (this.options.emitter?.listenerCount('ratelimit')) {
                        this.options.emitter.emit('ratelimit', {
                            url: this.buildUrl(options),
                            timeout: this.options.ratelimitTimeout,
                        })
                    }
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
                    if (errors == null) {
                        const body = await parseResponse<PatreonErrorResponseBody>(response)

                        if (isValidErrorBody(body)) {
                            errors = body.errors
                        } else {
                            throw new Error('Received an invalid error response:\n' + JSON.stringify(body))
                        }
                    }

                    throw errors.map(error => {
                        return new PatreonError(error, getHeaders(response.headers))
                    })
                }
            }
        }

        const response = await tryRequest()
        const parsed = parseResponse<Parsed>(response)

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

    private async makeRequest (options: InternalRequestOptions & { currentRetries: number }) {
        await this.waitForRatelimit()
        await this.requestCounter.addRequest()

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
}
