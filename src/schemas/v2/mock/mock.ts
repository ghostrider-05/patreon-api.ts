import type { MockInterceptor } from 'undici-types/mock-interceptor'

import paths from '../api/paths'

import { RouteBases, RequestMethod, Routes } from '../../../rest/v2/'

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

// eslint-disable-next-line jsdoc/require-jsdoc
function getAPIRouteKey (route: typeof paths[number]): keyof typeof Routes {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Object
        .entries(Routes)
        .find(key => key[1](':id') === route.route(':id'))![0] as keyof typeof Routes
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
        method?: string
    }) => {
        headers: Record<string, string>
        body: string
        status: number
    }
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
        this.cache = new PatreonMockCache(options.cache ?? {})
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

    private buildResponseFromUrl (url: string, resourceId?: string) {
        const { pathname, searchParams } = new URL(url)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { path, param } = findAPIPath(pathname)!
        if (path.response?.status != undefined && path.response.status !== 200) return null

        const parsed = this.parseQueryRelationships(searchParams, path.resource)
        // Add typed query?
        const query = parsed as unknown as { includes: never[], attributes: RelationshipMap<Type, never> }
        const id = resourceId ?? param

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
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(this.options.responseOptions?.headers ?? {}),
            ...(options?.headers ?? {}),
        }

        const data = (this.statusCodesWithNoContent.includes(statusCode))
            ? () => ''
            : (statusCode === 200
                ? (options: MockInterceptor.MockResponseCallbackOptions) => {
                    return this.buildResponseFromUrl(options.origin + options.path) ?? ''
                }
                : () => JSON.stringify(([
                    this.data.createError(statusCode)
                ]))
            )

        return (options: MockInterceptor.MockResponseCallbackOptions) => {
            this.validateHeaders(options.headers)

            return {
                statusCode,
                data: data(options),
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
        return paths.reduce<Record<keyof typeof Routes, PatreonMockHandler>>((handlers, route) => {
            const handler: PatreonMockHandler['handler'] = (request) => {
                this.validateHeaders(request.headers)
                const response = this.buildResponseFromUrl(request.url)

                return {
                    body: response ?? '',
                    status: route.response?.status ?? 200,
                    headers: {},
                }
            }

            return {
                ...handlers,
                [getAPIRouteKey(route)]: {
                    handler,
                    method: RequestMethod.Get.toLowerCase(),
                    url: ((options?.includeOrigin ?? true) ? PatreonMock.origin : '')
                        + PatreonMock.path
                        + route.route(options?.pathParam ?? '*'),
                }
            }
        }, {} as never)
    }
}
