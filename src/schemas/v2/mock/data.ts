import { randomUUID } from 'node:crypto'

import type {
    Relationship,
    RelationshipFields,
    RelationshipFieldToFieldType,
    RelationshipItem,
    RelationshipMap,
} from '../relationships'

import type { ItemMap, ItemType, Type } from '../item'

import { QueryBuilder } from '../query'

import {
    type PatreonErrorData,
    RequestMethod,
    ResponseHeaders,
} from '../../../rest/v2/'

import type { ListRequestPayload } from '../../../payloads/v2/internals/list'
import type { GetRequestPayload } from '../../../payloads/v2/internals/get'

import {
    defaultRandomDataGenerator,
    type RandomInteger,
    resolveRandomInteger,
    type RandomDataGenerator,
} from './random'
import { PatreonMockDataRandomResources } from '../generated/random'

import type {
    WriteResourcePayload,
    WriteResourceResponse,
    WriteResourceType,
} from '../modifiable'

export interface PatreonMockHeaderData {
    uuid?: string
    sha?: string
    rayId?: string
    ratelimit?: {
        retryAfter: string
    }
}

export interface PatreonMockDataOptions {
    /**
     * Overwrite attributes when creating a random resource
     */
    resources?: Partial<{ [T in ItemType]: (id: string) => Partial<ItemMap[T]> }>
    /**
     * Methods to create a random type.
     *
     * Note: I recommend to overwrite it with your own fake data generation methods.
     */
    random?: Partial<RandomDataGenerator>

    mockAttributes?: {
        [T in WriteResourceType]?: Partial<{
            [M in RequestMethod]: (body: WriteResourcePayload<WriteResourceType, M>) => WriteResourceResponse<WriteResourceType>
        }>
    }
}

export interface PatreonMockIdOptions {
    /**
     * For `'pledge-event'` resource: the type of the event.
     * Defaults to `'subscription'`
     */
    pledgeType?: ItemMap[Type.PledgeEvent]['type']
}

export class PatreonMockData {
    public options: PatreonMockDataOptions
    public random: PatreonMockDataRandomResources

    public constructor (options?: PatreonMockDataOptions) {
        this.options = options ?? {}

        this.random = new PatreonMockDataRandomResources({
            ...defaultRandomDataGenerator,
            ...options?.random ?? {},
        }, options?.resources)
    }

    /**
     * Get a response body for a single resource to mock a response payload
     * @param type The type of the resource that is returned
     * @param query The query to select the relationships and attributes returned
     * @param query.includes The requested relationships on the item
     * @param query.attributes The attribute map to filter the returned attributes
     * @param data The resource item, id and related items
     * @param data.id The id of the resource
     * @param data.item The attributes of the resource. If partial, the other attributes will be generated randomly.
     * @param data.relatedItems If requesting relationships, all items that can be returned as a relationship
     * @returns the JSON:API response payload
     */
    public getSingleResponsePayload<T extends Type | ItemType, I extends RelationshipFields<T>, A extends RelationshipMap<T, I>>(
        type: T,
        query: {
            includes: I[]
            attributes: A
        },
        data: {
            id: string
            item: Partial<ItemMap[T]>
            relatedItems: RelationshipItem<T, I, A>[]
        }
    ): GetRequestPayload<T, I, A> {
        const url = this.createAPIUrl(type, data.id)
        const attributeItem = this.getAttributeItem(type, data.id, data.item, query.attributes[type] as (keyof ItemMap[T])[] ?? [])

        if (query.includes.length === 0) {
            return {
                links: { self: url },
                data: attributeItem,
            } as GetRequestPayload<T, I, A>
        } else {
            const { included, relationships } = this.filterRelationships(type, data.relatedItems, query)

            return {
                links: { self: url },
                data: {
                    ...attributeItem,
                    relationships,
                },
                included,
            } as GetRequestPayload<T, I, A>
        }
    }

    /**
     * Get a response body for multiple resources to mock a response payload
     * @param type The type of the resource that is returned
     * @param query The query to select the relationships and attributes returned
     * @param query.includes The requested relationships on the item
     * @param query.attributes The attribute map to filter the returned attributes
     * @param data The resource item, id and related items
     * @param data.items The attributes of the resources. If partial, the other attributes will be generated randomly.
     * @returns the JSON:API response payload
     */
    public getListResponsePayload<T extends Type | ItemType, I extends RelationshipFields<T>, A extends RelationshipMap<T, I>>(
        type: T,
        query: {
            includes: I[];
            attributes: A;
        },
        data: {
            items: {
                item: {
                    id: string
                    attributes: Partial<ItemMap[T]>
                }
                included: RelationshipItem<T, I, A>[]
            }[]
        },
    ): ListRequestPayload<T, I, A> {
        const items = data.items.map(({ item }) => {
            // @ts-expect-error TODO: add a new type to remove this error
            return this.getAttributeItem<T, A[T]>(
                type,
                item.id,
                item.attributes,
                query.attributes[type]
            )
        })

        const meta = {
            pagination: {
                total: items.length,
                cursors: { next: 'cursor' },
            }
        }

        if (query.includes.length === 0) {
            return {
                data: items,
                meta,
            } as ListRequestPayload<T, I, A>
        } else {
            const mappedItems = data.items.map(({ included }, i) => {
                const { included: relatedItems, relationships } = this.filterRelationships(type, included, query)
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const attributes = items[i]!

                return {
                    item: {
                        ...attributes,
                        relationships,
                    },
                    included: relatedItems,
                }
            })

            return {
                data: mappedItems.map(item => item.item),
                included: mappedItems.map(item => item.included).flat(),
                meta,
            }
        }
    }

    public createRelatedItems<T extends ItemType> (type: T, options?: {
        items?: RelationshipItem<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>>[]
        // length?: RandomInteger,
    }): RelationshipItem<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>>[] {
        const relationMap = QueryBuilder.createRelationMap(type)
        const relationTypes = Object.values(relationMap) as RelationshipFieldToFieldType<T, RelationshipFields<T>>[]

        return relationTypes.flatMap(key => {
            const relatedItems = options?.items?.filter(item => item.type === key) ?? []
            if (relatedItems.length > 0) return relatedItems

            return this.getAttributeItems(key, undefined, undefined, {
                length: 1,
            })
        })
    }

    /**
     * @param type The resource type of the item to return
     * @param id The id of the item to return. If not given, creates a random id
     * @param data The attributes of the item. If no attributes are defined, they are merged with random attributes
     * @param attributes The attributes query to apply. This filters all the attributes in the item
     */
    public getAttributeItem<T extends ItemType, A extends keyof ItemMap[T] = keyof ItemMap[T]>(
        type: T,
        id?: string,
        data?: Partial<ItemMap[T]>,
        attributes?: A[],
    ): AttributeItem<T, Pick<ItemMap[T], A>> {
        const itemId = id ?? this.createId(type)
        const item = { ...this.random[type](itemId), ...(data ?? {}) }

        return {
            type,
            id: itemId,
            attributes: (attributes == undefined ? item : (attributes.length === 0
                ? {}
                : Object.keys(item)
                    .filter(k => attributes.includes(<A>k))
                    .reduce((obj, key) => ({ ...obj, [key]: item[key] }), {}))) as Pick<ItemMap[T], A>,
        }
    }

    public getAttributeItems<T extends ItemType, A extends keyof ItemMap[T]>(
        type: T,
        items?: { id?: string, data?: Partial<ItemMap[T]> }[],
        attributes?: A[],
        options?: {
            length?: RandomInteger,
        }
    ): AttributeItem<T, Pick<ItemMap[T], A>>[] {
        return Array.from({ length: resolveRandomInteger(options?.length, items, 10) }, (_, i) => {
            return this.getAttributeItem(
                type,
                items?.at(i)?.id,
                items?.at(i)?.data,
                attributes,
            )
        })
    }

    public filterRelationships<
        T extends ItemType,
        I extends RelationshipFields<T>,
        A extends RelationshipMap<T, I>
    >(
        type: T,
        relatedItems: RelationshipItem<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>>[],
        query: { includes: I[]; attributes: A; },
    ): { included: RelationshipItem<T, I, A>[] } & Relationship<T, I> {
        const resource = QueryBuilder['getResource']<T>(type).relationships
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const getRelation = <F extends RelationshipFields<T>>(name: F) => resource.find(r => r.name === name)!

        const relationships = query.includes.reduce<Relationship<T, I>['relationships']>((obj, relation) => {
            const rel = getRelation(relation)
            const items = relatedItems.filter(i => i.type === rel.resource)

            if (rel.type === 'item') {
                const firstItem = items[0]
                if (!firstItem) throw new Error()

                return {
                    ...obj,
                    [relation]: {
                        data: { type: rel.resource, id: firstItem.id },
                        links: { related: this.createAPIUrl(rel.resource, firstItem.id) },
                    },
                }
            } else {
                return {
                    ...obj,
                    [relation]: {
                        data: items.map(i => ({ type: i.type, id: i.id })),
                    },
                }
            }
        }, {} as never)

        return {
            relationships,
            included: relatedItems.map(item => {
                return this.getAttributeItem(
                    item.type,
                    item.id,
                    // @ts-expect-error TODO: WTF is this error
                    item.attributes,
                    query.attributes[item.type],
                )
            })
        }
    }

    /**
     * Creates a random ID (UUID for a member) for a resource
     * @param type The type of the resource
     * @param options For certain resources, additional information can be used to create an ID
     * @returns a random string
     */
    public createId (
        type: Type | ItemType,
        options?: PatreonMockIdOptions,
    ): string {
        return PatreonMockData.createId(type, options)
    }

    /**
     * Creates the API url for a resource
     * @param type The type of the resource.
     * The documentation currently allows requests (see documentation for the allowed methods) for:
     * - campaign
     * - member
     * - post
     * - webhook
     * @param id The id of the resource
     * @returns `https://patreon.com/api/oauth2/v2/${type}s/${id}`
     * @see https://docs.patreon.com/#apiv2-resource-endpoints
     */
    public createAPIUrl (type: Type | ItemType, id: string): string {
        return PatreonMockData.createAPIUrl(type, id)
    }

    /**
     * Creates some headers that are generally returned by the Patreon API
     * @param data The header values
     * @returns The following headers:
     * - `x-patreon-uuid`
     * - `x-patreon-sha`
     * - `Retry-After` (if a ratelimit is given)
     * - `Content-Type`
     * - `cf-ray`
     * - `cf-cache-status`
     */
    public createHeaders (data?: PatreonMockHeaderData): Record<string, string> {
        return PatreonMockData.createHeaders(data)
    }

    /**
     * Create an error-like object. An error response is of type `{ errors: PatreonErrorData[] }`
     * @param status The response status
     * @param data Optional data to better mock the error
     * @returns the mocked error
     */
    public createError (status: number, data?: Partial<Omit<PatreonErrorData, 'status'>>): PatreonErrorData {
        return PatreonMockData.createError(status, data)
    }

    /**
     * Creates the API url for a resource
     * @param type The type of the resource.
     * The documentation currently allows requests (see documentation for the allowed methods) for:
     * - campaign
     * - member
     * - post
     * - webhook
     * @param id The id of the resource
     * @returns `https://patreon.com/api/oauth2/v2/${type}s/${id}`
     * @see https://docs.patreon.com/#apiv2-resource-endpoints
     */
    public static createAPIUrl (type: Type | ItemType, id: string): string {
        return `https://patreon.com/api/oauth2/v2/${type}s/${id}`
    }

    /**
     * Creates a random ID (UUID for a member) for a resource
     * @param type The type of the resource
     * @param options For certain resources, additional information can be used to create an ID
     * @returns a random string
     */
    public static createId (
        type: Type | ItemType,
        options?: PatreonMockIdOptions,
    ): string {
        if (type === 'member') return randomUUID()

        const length = resolveRandomInteger({ min: 5, max: 10 })
        const randomString = Array.from({ length },
            () => resolveRandomInteger({ min: 0, max: 9 })
        ).join('')

        if (type === 'pledge-event') {
            return `${options?.pledgeType ?? 'subscription'}:${randomString}`
        }
        else return randomString
    }

    /**
     * Create an error-like object. An error response is of type `{ errors: PatreonErrorData[] }`
     * @param status The response status
     * @param data Optional data to better mock the error
     * @returns the mocked error
     */
    public static createError (status: number, data?: Partial<Omit<PatreonErrorData, 'status'>>): PatreonErrorData {
        return {
            status: status.toString(),
            code_challenge: null,
            code: 0,
            code_name: 'MockedError',
            id: 'MockError',
            title: 'The mock API errored',
            detail: 'An error was thrown by the mock API for the Patreon API',
            ...(data ?? {}),
        }
    }

    /**
     * Creates some headers that are generally returned by the Patreon API
     * @param data The header values
     * @returns The following headers:
     * - `x-patreon-uuid`
     * - `x-patreon-sha`
     * - `Retry-After` (if a ratelimit is given)
     * - `Content-Type`
     * - `cf-ray`
     * - `cf-cache-status`
     */
    public static createHeaders (data?: PatreonMockHeaderData): Record<string, string> {
        return {
            [ResponseHeaders.UUID]: data?.uuid ?? randomUUID(),
            [ResponseHeaders.CfCacheStatus]: 'DYNAMIC',
            [ResponseHeaders.Sha]: data?.sha ?? '',
            [ResponseHeaders.CfRay]: data?.rayId ?? '',
            ...(data?.ratelimit != undefined ? {
                [ResponseHeaders.RetryAfter]: data.ratelimit.retryAfter,
            } : {}),
            'Content-Type': 'application/json',
        }
    }
}
