import type { MockInterceptor } from 'undici-types/mock-interceptor'

import paths from '../api/paths'

import { RouteBases } from '../../../rest/v2/routes'
import type { PatreonErrorData } from '../../../rest/v2/oauth2'
import { ItemType, QueryBuilder, Type } from '../../../v2'

import { PatreonMockData, PatreonMockDataOptions } from './data'
import { PatreonMockCache, PatreonMockCacheOptions } from './cache'
import { PatreonMockWebhooks, PatreonMockWebhooksOptions } from './webhooks'

// eslint-disable-next-line jsdoc/require-jsdoc
function findAPIPath (path: string) {
    const escapeDots = (s: string) => Array.from(s, c => c === '.' ? '\\.' : c).join('')

    return paths.find(o => new RegExp(`^${o.route(':id')
        .split('/')
        .map((s: string) => s.startsWith(':') ? '[^\\/]+': escapeDots(s))
        .join('\\/')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    }$`).test(path.split('?')[0]!))
}

/**
 *
 * @param status
 */
// @ts-expect-error TODO: fix this
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createErrors (status: number): PatreonErrorData[] {
    return []
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

// type PatreonMockRoutes = ReturnType<typeof Routes[keyof typeof Routes]>

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
        public options: PatreonMockOptions,
    ) {
        this.cache = new PatreonMockCache(options.cache ?? {})
        this.data = options.data != undefined && options.data instanceof PatreonMockData
            ? options.data
            : new PatreonMockData(options.data)

        // @ts-expect-error TODO: fix this
        this.webhooks = new PatreonMockWebhooks(options.webhooks ?? {})
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

    private buildResponseFromUrl (url: string) {
        const { pathname, searchParams } = new URL(url)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const path = findAPIPath(pathname)!
        if (path.response?.status != undefined && path.response.status !== 200) return null

        const parsed = this.parseQueryRelationships(searchParams, path.resource)
        // const { attributes, includes } = parsed

        if (path.response?.array) {
            // @ts-expect-error TODO: fix this
            const cached = this.cache.getRelated<Type, Type>(path.resource, '', path.resource)

            if (cached) {
                // @ts-expect-error TODO: fix this
                const payload = this.data.getListResponsePayload(path.resource, parsed, {
                    items: cached?.combined,
                })

                return JSON.stringify(payload)
            } else {
                // TODO: generate random data
                return JSON.stringify('')
            }
        } else {
            const cached = this.cache.get(path.resource, '')

            if (cached) {
                // @ts-expect-error TODO: fix this
                const payload = this.data.getSingleResponsePayload(path.resource, parsed, {
                    id: cached.id,
                    item: cached.attributes,
                    relatedItems: cached.included,
                })

                return JSON.stringify(payload)
            } else {
                const id = this.data.createId(path.resource)
                const attributes = this.data.random[path.resource](id)

                // @ts-expect-error TODO: fix this
                const payload = this.data.getSingleResponsePayload(path.resource, parsed, {
                    id,
                    item: attributes,
                    relatedItems: [],
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
     * @param statusCode The status code that the intercepted response should have.
     * Default: `200`.
     * @returns the intercept callback
     */
    public getMockAgentReplyCallback (statusCode: number = 200) {
        const headers = {
            'Content-Type': 'application/json',
            ...(this.options.responseOptions?.headers ?? {})
        }

        if (this.statusCodesWithNoContent.includes(statusCode)) return () => ({
            statusCode,
            responseOptions: { headers },
        })
        else if (statusCode === 200) return (options: MockInterceptor.MockResponseCallbackOptions) => {
            const data = this.buildResponseFromUrl(options.origin + options.path)

            return {
                statusCode,
                data: data ?? undefined,
                responseOptions: { headers },
            }
        }
        else return () => ({
            statusCode,
            data: JSON.stringify(createErrors(statusCode)),
            responseOptions: { headers },
        })
    }

    public getMockHandlers () {

    }
}
