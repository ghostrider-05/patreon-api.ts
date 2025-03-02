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

import { PatreonMockData, type PatreonMockDataOptions } from './data'
import { PatreonMockCache, type PatreonMockCacheOptions } from './cache'
import { PatreonMockWebhooks, type PatreonMockWebhooksOptions } from './webhooks'

// eslint-disable-next-line jsdoc/require-jsdoc
function findAPIPath (path: string) {
    const escapeDots = (s: string) => Array.from(s, c => c === '.' ? '\\.' : c).join('')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pathWithoutQuery = path.split('?')[0]!

    const route = paths.find(o => new RegExp(`^${o.route(':id')
        .split('/')
        .map((s: string) => s.startsWith(':') ? '[^\\/]+': escapeDots(s))
        .join('\\/')
    }$`).test(pathWithoutQuery))
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
    cache?: PatreonMockCacheOptions
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
        headers: Record<string, string>
        body?: string
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

export class PatreonMock {
    public static origin = new URL(RouteBases.oauth2).origin
    public static path = new URL(RouteBases.oauth2).pathname

    public static pathFilter = (path: string): boolean => {
        return findAPIPath(path) != undefined
    }

    private statusCodesWithNoContent: number[] = [201]

    public cache: PatreonMockCache
    public data: PatreonMockData
    public webhooks: PatreonMockWebhooks

    public constructor (
        public options: PatreonMockOptions = {},
    ) {
        this.cache = new PatreonMockCache(options.cache ?? {}, (type) => ({
            id: this.data.createId(type)
        }))

        this.data = options.data != undefined && options.data instanceof PatreonMockData
            ? options.data
            : new PatreonMockData(options.data)

        // @ts-expect-error TODO: fix this
        this.webhooks = new PatreonMockWebhooks(options.webhooks ?? {})
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

        const apiPath = findAPIPath(pathname)
        if (apiPath == undefined) throw new Error('No API route found to mock for: ' + url)

        return {
            ...apiPath,
            searchParams,
        }
    }

    private buildResponseFromUrl (route: ParsedRoute, options?: {
        resourceId?: string
        method?: string
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

            if (cached) {
                const payload = this.data.getListResponsePayload(path.resource, query, {
                    items: cached.combined,
                })

                return JSON.stringify(payload)
            } else {
                const payload = this.data.getListResponsePayload(path.resource, query, {
                    items: this.data.getAttributeItems(path.resource).map(item => ({
                        item,
                        included: this.data.createRelatedItems(item.type)
                    })),
                })

                return JSON.stringify(payload)
            }
        } else {
            const cached = id ? this.cache.get(path.resource, id) : null

            if (id && cached) {
                const payload = this.data.getSingleResponsePayload(path.resource, query, {
                    id,
                    item: cached.attributes,
                    relatedItems: cached.included,
                })

                return JSON.stringify(payload)
            } else {
                const id = this.data.createId(path.resource)
                const attributes = this.data.random[path.resource](id)

                const payload = this.data.getSingleResponsePayload(path.resource, query, {
                    id,
                    item: attributes,
                    relatedItems: this.data.createRelatedItems(path.resource),
                })

                return JSON.stringify(payload)
            }
        }
    }

    private getResponseHeaders (headers?: Record<string, string>): Record<string, string> {
        return {
            'Content-Type': 'application/json',
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
     * @returns the intercept callback
     */
    public getMockAgentReplyCallback (options?: {
        statusCode?: number
        headers?: Record<string, string>
    }) {
        const statusCode = options?.statusCode ?? 200
        const headers = this.getResponseHeaders(options?.headers)

        const data = (this.statusCodesWithNoContent.includes(statusCode))
            ? () => ''
            : (statusCode === 200
                ? (
                    options: MockInterceptor.MockResponseCallbackOptions,
                    route: ParsedRoute
                ) => {
                    return this.buildResponseFromUrl(route, {
                        method: options.method,
                    }) ?? ''
                }
                : () => JSON.stringify(([
                    this.data.createError(statusCode)
                ]))
            )

        return (options: MockInterceptor.MockResponseCallbackOptions) => {
            this.validateHeaders(options.headers)

            const route = this.parseAPIPath(options.origin + options.path)
            this.cache.setRequestBody(options.method, Type.Webhook, route.param, options.body?.toString())

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
     * @see https://patreon-api.pages.dev/guide/features/sandbox#msw
     * @returns Handlers for each route that returns a successful response.
     */
    public getMockHandlers (options?: {
        pathParam?: string
        includeOrigin?: boolean
    }) {
        return paths.reduce<Record<PatreonMockRouteId, PatreonMockHandler>>((handlers, route) => {
            return {
                ...handlers,
                ...route.methods.reduce<Record<PatreonMockRouteId, PatreonMockHandler>>((obj, method) => {
                    const handler: PatreonMockHandler['handler'] = (request) => {
                        this.validateHeaders(request.headers)
                        const route = this.parseAPIPath(request.url)
                        this.cache.setRequestBody(method.method, Type.Webhook, route.param, request.body?.toString())

                        const response = this.buildResponseFromUrl(route)

                        return {
                            body: response ?? '',
                            status: this.getResponseStatus(route.path, method.method),
                            headers: this.getResponseHeaders(),
                        }
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
