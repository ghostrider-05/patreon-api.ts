import type { MockInterceptor } from 'undici-types/mock-interceptor'

import paths from '../api/paths'
import type { Route } from '../api/types'

import {
    RouteBases,
    RequestMethod,
} from '../../../rest/v2/'

import {
    type ItemType,
    QueryBuilder,
    type RelationshipFieldsToItem,
    RelationshipMap,
    Type,
} from '../../../schemas/v2/'

import {
    CacheStore,
    type CacheStoreOptions,
} from '../cache/'

import { PatreonMockData, type PatreonMockDataOptions } from './data'
import { PatreonMockWebhooks, type PatreonMockWebhooksOptions } from './webhooks'

function getAPIRoutesWithRegex (routes: Route[]) {
    const escapeDots = (s: string) => Array.from(s, c => c === '.' ? '\\.' : c).join('')

    return routes.map(o => ({
        route: o,
        exp: new RegExp(`^${o.route(':id')
            .split('/')
            .map((s: string) => s.startsWith(':') ? '[^\\/]+': escapeDots(s))
            .join('\\/')
        }$`),
    }))
}

// eslint-disable-next-line jsdoc/require-jsdoc
function findAPIPath (path: string, apiPath: string) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pathWithoutQuery = path.split('?')[0]!
    const regexs = getAPIRoutesWithRegex(paths)

    const route = regexs.find(reg => {
        return reg.exp.test(pathWithoutQuery)
            || reg.exp.test(pathWithoutQuery.slice(apiPath.length))
    })?.route
    if (!route) return
    const routeId = route.route(':id')

    return {
        param: pathWithoutQuery.split('/').find((_, i) => routeId.split('/')[i] === ':id'),
        routeId,
        path: route,
    }
}

export interface PatreonMockOptions {
    validation?: {
        headers?: string[] | Record<string, string>
        query?: boolean
    }
    responseOptions?: {
        cache?: boolean
        headers?: Record<string, string>
    }
    cache?: Pick<CacheStoreOptions, 'initial'>
    data?:
        | PatreonMockData
        | PatreonMockDataOptions
    webhooks?: PatreonMockWebhooksOptions
}

export interface PatreonMockHandler {
    url: string
    method: Lowercase<RequestMethod>
    handler: (request: {
        url: string
        headers: Record<string, string> | Headers
        body?: string | null
    }) => {
        headers: Record<string, string>
        body: string
        status: number
    }
}

type PatreonMockRouteId = typeof paths[number]['methods'][number]['id']

interface ParsedRoute {
    searchParams: URLSearchParams
    path: Route
    param: string | undefined
}

/**
 * A class with utitilies to mock the Patreon API
 * @see https://patreon-api.pages.dev/guide/features/sandbox
 */
export class PatreonMock {
    /**
     * The origin url for the Patreon API
     * @constant 'https://patreon.com'
     */
    public static origin = new URL(RouteBases.oauth2).origin

    /**
     * The API path that every route starts with
     * @constant '/api/oauth2/v2'
     */
    public static path = new URL(RouteBases.oauth2).pathname

    /**
     * A filter to check if a random path is an API route
     * @param path The path to check. Can include query parameters
     * @returns if the path is valid route for the V2 Patreon API
     */
    public static pathFilter = (path: string): boolean => {
        return findAPIPath(path, PatreonMock.path) != undefined
    }

    private statusCodesWithNoContent: number[] = [201]

    public cache: CacheStore<false>
    public data: PatreonMockData
    public webhooks: PatreonMockWebhooks

    public constructor (
        public options: PatreonMockOptions = {},
    ) {
        this.cache = new CacheStore(undefined, false, {
            initial: options.cache?.initial ?? [],
        })

        this.data = options.data != undefined && options.data instanceof PatreonMockData
            ? options.data
            : new PatreonMockData(options.data)

        this.webhooks = new PatreonMockWebhooks(options.webhooks ?? {}, this.data, this.cache)
    }

    private validateHeaders (headers: Record<string, string> | Headers): void {
        const validation = this.options.validation?.headers
        if (validation == undefined) return
        const headersRecord = typeof headers.entries === 'function'
            ? [...headers.entries()].reduce<Record<string, string>>((obj, [key, value]) => ({ ...obj, [key]: value }), {})
            : headers as Record<string, string>

        const missing = (Array.isArray(validation) ? validation : Object.keys(validation))
            .filter(name => !headersRecord[name] && !headersRecord[name.toLowerCase()])

        if (missing.length > 0) {
            throw new Error('Missing required header on mocked request: ' + missing.join(','))
        }

        if (!Array.isArray(validation)) {
            for (const [name, value] of Object.entries(validation)) {
                const header = headersRecord[name] ?? headersRecord[name.toLowerCase()]
                if (header !== value) throw new Error('Invalid header on mocked request: ' + name)
            }
        }
    }

    private validateProperties (key: ItemType, attributes: string[]): void {
        const { properties } = QueryBuilder['getResource'](key)

        if (!attributes.every(a => !properties.includes(<never>a))) {
            throw new Error('Invalid properties found on ' + key + ':' + attributes.join(','))
        }
    }

    private parseQueryRelationships (params: URLSearchParams, resource: ItemType) {
        const include: string[] = params.get('include')?.split(',') ?? []
        const { relationships } = QueryBuilder['getResource'](resource)
        const includedKeys: ItemType[] = include
            .map(key => relationships.find(r => r.name === key)?.resource)
            .filter((n): n is NonNullable<typeof n> => n != undefined)

        if (this.options.validation?.query && includedKeys.some(k => k == undefined)) {
            throw new Error('Unable to find relationships in query params: ' + include.join(','))
        }

        return {
            resource,
            includes: include,
            attributes: (includedKeys.concat(resource)).reduce<Partial<Record<ItemType, string[]>>>((obj, key) => {
                const attributes: string[] = params.get(`fields[${key}]`)?.split(',') ?? []

                if (this.options.validation?.query) {
                    this.validateProperties(key, attributes)
                }

                return {
                    ...obj,
                    [key]: attributes,
                }
            }, {})
        }
    }

    private getResponseStatus (route: Route, method?: string) {
        const options = route.methods.find(m => {
            return m.method.toLowerCase() === (method ?? RequestMethod.Get).toLowerCase()
        })

        return options && 'responseStatus' in options ? options.responseStatus
            : ('response' in route && 'status' in route.response && typeof route.response.status === 'number'
                ? route.response.status
                : 200)
    }

    private parseAPIPath (url: string): ParsedRoute {
        const { pathname, searchParams } = new URL(url)

        const apiPath = findAPIPath(pathname, PatreonMock.path)
        if (apiPath == undefined) throw new Error('No API route found to mock for: ' + url)

        return {
            ...apiPath,
            searchParams,
        }
    }

    private buildResponseFromUrl (route: ParsedRoute, options?: {
        resourceId?: string
        method?: string
        cache?: boolean | undefined
        random?: boolean | undefined
    }) {
        const { param, path, searchParams } = route

        const defaultResponseStatus = this.getResponseStatus(path, options?.method)
        if (defaultResponseStatus !== 200) return null

        const parsed = this.parseQueryRelationships(searchParams, path.resource)
        // Add typed query?
        const query = parsed as unknown as { includes: never[], attributes: RelationshipMap<Type, never> }
        const id = options?.resourceId ?? param

        if (path.response?.array) {
            // All current list endpoints are related to a campaign
            // E.g campaign members, campaign posts
            // TODO: in the future make this configurable when new endpoints are added
            const cached = id
                ? this.cache.getRelated(Type.Campaign, id, path.resource as RelationshipFieldsToItem<Type.Campaign>)
                : null

            if (cached && options?.cache !== false) {
                const payload = this.data.getListResponsePayload(path.resource, query, {
                    items: cached.item,
                })

                return JSON.stringify(payload)
            } else if (options?.random !== false) {
                const payload = this.data.getListResponsePayload(path.resource, query, {
                    items: this.data.getAttributeItems(path.resource).map(item => ({
                        item,
                        included: this.data.createRelatedItems(item.type)
                    })),
                })

                return JSON.stringify(payload)
            } else return ''
        } else {
            const cached = id ? this.cache.get(path.resource, id) : null

            if (id && cached && options?.cache !== false) {
                const payload = this.data.getSingleResponsePayload(path.resource, query, {
                    id,
                    item: cached.attributes,
                    relatedItems: cached.included,
                })

                return JSON.stringify(payload)
            } else if (options?.random !== false) {
                const id = this.data.createId(path.resource)
                const attributes = this.data.random[path.resource](id)

                const payload = this.data.getSingleResponsePayload(path.resource, query, {
                    id,
                    item: attributes,
                    relatedItems: this.data.createRelatedItems(path.resource),
                })

                return JSON.stringify(payload)
            } else return ''
        }
    }

    private getResponseHeaders (headers?: Record<string, string>): Record<string, string> {
        return {
            ...this.data.createHeaders(),
            ...(this.options.responseOptions?.headers ?? {}),
            ...(headers ?? {}),
        }
    }

    /**
     * Note: Uses the `undici-types` package for typing.
     * If you don't have `undici` or `undici-types` installed, ts will be not be able to import the types.
     *
     * Creates a callback for an intercepted request on a mock agent.
     * @param options Options for the mocked response
     * @param options.statusCode The status code the response should have, defaults to `200`
     * @param options.headers The headers to include in the response
     * @param options.random
     * @param options.cache
     * @returns the intercept callback
     */
    public getMockAgentReplyCallback (options?: {
        statusCode?: number
        headers?: Record<string, string>
        random?: boolean
        cache?: boolean
    }) {
        const statusCode = options?.statusCode ?? 200
        const headers = this.getResponseHeaders(options?.headers)

        const data = (this.statusCodesWithNoContent.includes(statusCode))
            ? () => ''
            : (statusCode === 200
                ? (
                    _options: MockInterceptor.MockResponseCallbackOptions,
                    route: ParsedRoute,
                ) => {
                    return this.buildResponseFromUrl(route, {
                        cache: options?.cache,
                        random: options?.random,
                        method: _options.method,
                    }) ?? ''
                }
                : () => JSON.stringify({
                    errors: [
                        this.data.createError(statusCode)
                    ]
                })
            )

        return (options: MockInterceptor.MockResponseCallbackOptions) => {
            this.validateHeaders(options.headers)

            const route = this.parseAPIPath(options.origin + options.path)
            this.cache.syncRequest({
                method: options.method,
                pathResource: Type.Webhook,
                pathId: route.param,
            }, null)

            return {
                statusCode,
                data: data(options, route),
                responseOptions: { headers },
            }
        }
    }

    /**
     * Get handlers for mocking a route
     * @param options Options for generating the routes
     * @param options.pathParam The path param template value, defaults to `*`
     * @param options.includeOrigin Whether to include the API origin in the url of the handler, defaults to `true`
     * @param options.transformResponse Method to transform the default response for a handler
     * @param options.random
     * @param options.cache
     * @see https://patreon-api.pages.dev/guide/features/sandbox#msw
     * @returns Handlers for each route that returns a successful response.
     */
    public getMockHandlers <
        R = ReturnType<PatreonMockHandler['handler']>
    >(options?: {
        pathParam?: string
        includeOrigin?: boolean
        transformResponse?: (response: ReturnType<PatreonMockHandler['handler']>) => R
        random?: boolean
        cache?: boolean
    }) {
        type Handler = Omit<PatreonMockHandler, 'handler'> & {
            handler: (...args: Parameters<PatreonMockHandler['handler']>) => R
        }

        return paths.reduce<Record<PatreonMockRouteId, Handler>>((handlers, route) => {
            return {
                ...handlers,
                ...route.methods.reduce<Record<PatreonMockRouteId, Handler>>((obj, method) => {
                    const handler: Handler['handler'] = (request) => {
                        this.validateHeaders(request.headers)
                        const route = this.parseAPIPath(request.url)
                        if (this.options.responseOptions?.cache) {
                            this.cache.setRequestBody(method.method, Type.Webhook, route.param, request.body?.toString())
                        }

                        const response = this.buildResponseFromUrl(route, {
                            cache: options?.cache,
                            random: options?.random,
                            method: method.method,
                        })

                        const data = {
                            body: response ?? '',
                            status: this.getResponseStatus(route.path, method.method),
                            headers: this.getResponseHeaders(),
                        }

                        return options?.transformResponse != undefined
                            ? options.transformResponse(data)
                            : <R>data
                    }

                    return {
                        ...obj,
                        [method.id]: {
                            handler,
                            method: method.method.toLowerCase(),
                            url: ((options?.includeOrigin ?? true) ? PatreonMock.origin : '')
                                + PatreonMock.path
                                + route.route(options?.pathParam ?? '*'),
                        }
                    }
                }, {} as never),
            }
        }, {} as never)
    }
}
