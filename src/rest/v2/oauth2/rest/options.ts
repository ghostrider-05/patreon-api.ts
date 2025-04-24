import { RouteBases } from '../../routes'

import type {
    PatreonHeadersData,
    RestHeaders,
} from './headers'

import {
    defaultRetries,
    type RestRetries,
} from './retries'

export enum RequestMethod {
    Delete = 'DELETE',
    Get = 'GET',
    Patch = 'PATCH',
    Post = 'POST',
}

export type RestResponse = Pick<Response,
    | 'body'
    | 'bodyUsed'
    | 'json'
    | 'ok'
    | 'status'
    | 'text'
> & { headers: RestHeaders }

export type RestFetcher = (url: string, init: RequestInit) => Promise<RestResponse>

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
    >]
    ratelimit: [data: {
        url: string
        timeout: number
    }]
}

export interface RESTOptions<IncludeAllQuery extends boolean = boolean> {
    /**
     * The base url of the Patreon API
     * @default 'https://patreon.com/api/oauth2/v2'
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
     * @deprecated Since this is not able to refresh tokens, this will be removed in the future.
     * If you do depend on this method, please open an issue with your usecase.
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
     * @default 'https://patreon.com/api/oauth2/v2'
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

export const DefaultRestOptions: RESTOptions = {
    authPrefix: 'Bearer',
    api: RouteBases.oauth2,
    emitter: null,
    includeAllQueries: false,
    fetch: (...args) => fetch(...args),
    getAccessToken: async () => undefined,
    globalRequestPerSecond: 0,
    ratelimitTimeout: 0,
    retries: defaultRetries,
    timeout: 15_000,
    headers: {},
    userAgentAppendix: '',
}

export interface InternalRequestOptions extends RequestOptions {
    path: string
    method?: RequestMethod | `${RequestMethod}`
}
