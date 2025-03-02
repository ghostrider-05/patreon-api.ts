import { randomUUID } from 'node:crypto'

import {
    QueryBuilder,
    type ItemMap,
    type Relationship,
    type RelationshipFields,
    type RelationshipFieldToFieldType,
    type RelationshipItem,
    type RelationshipMap,
    type Type,
} from '..'

import type { ListRequestPayload } from '../../../payloads/v2/internals/list'
import type { GetRequestPayload } from '../../../payloads/v2/internals/get'

import type { RandomDataGenerator } from './random'
import RandomDataResources from '../generated/random'
import { PatreonErrorData } from '../../../v2'

export interface PatreonMockDataOptions {
    resources?: Partial<{ [T in keyof ItemMap]: (id: string) => Partial<ItemMap[T]> }>
    random?: Partial<RandomDataGenerator>
}

const _random = <T>(list: T[]): T => list[list.length * Math.random() | 0] as T
const _random_int = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

export class PatreonMockData {
    public options: PatreonMockDataOptions
    public random: RandomDataResources
    public randomGenerators: RandomDataGenerator

    // @ts-expect-error TODO: fix this
    protected static defaultRandom: Required<NonNullable<PatreonMockDataOptions['random']>> = {
        arrayElement: _random,
        boolean: () => _random([true, false]),
        number: () => _random(Array.from({ length: 40 }, (_, i) => i)),
        countryCode: () => _random(['NL', 'BE', 'DE']),
    }

    public constructor (options?: PatreonMockDataOptions) {
        this.options = options ?? {}
        this.randomGenerators = {
            ...PatreonMockData.defaultRandom,
            ...options?.random ?? {},
        }

        this.random = new RandomDataResources(this.randomGenerators, options?.resources)
    }

    public getSingleResponsePayload<T extends Type, I extends RelationshipFields<T>, A extends RelationshipMap<T, I>>(
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

    public getListResponsePayload<T extends Type, I extends RelationshipFields<T>, A extends RelationshipMap<T, I>>(
        type: T,
        query: { includes: I[]; attributes: A; },
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

    public createId (type: Type | keyof ItemMap): string {
        if (type === 'member') return randomUUID()
        else return Array.from({ length: _random_int(5, 10) }, () => _random_int(0, 9)).join('')
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
    public createAPIUrl (type: Type | keyof ItemMap, id: string): string {
        return `https://patreon.com/api/oauth2/v2/${type}s/${id}`
    }

    public createError (status: number, data?: Partial<Omit<PatreonErrorData, 'status'>>): PatreonErrorData {
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

    public createRelatedItems <T extends keyof ItemMap>(type: T, options?: {
        items?: RelationshipItem<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>>[]
    }): RelationshipItem<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>>[] {
        const relationMap = QueryBuilder.createRelationMap(type)
        const relationTypes = Object.values(relationMap) as RelationshipFieldToFieldType<T, RelationshipFields<T>>[]

        return relationTypes.flatMap(key => {
            const relatedItems = options?.items?.filter(item => item.type === key) ?? []
            if (relatedItems.length > 0) return relatedItems

            // TODO: make the amount of items configurable
            const id = this.createId(key)
            return this.getAttributeItem(key, id)
        })
    }

    public getAttributeItem<T extends keyof ItemMap, A extends keyof ItemMap[T] = keyof ItemMap[T]>(
        type: T,
        id: string,
        data?: Partial<ItemMap[T]>,
        attributes?: A[],
    ) {
        const item = { ...this.random[type](id), ...(data ?? {}) }

        return {
            type,
            id,
            attributes: (attributes == undefined ? item : (attributes.length === 0
                ? {}
                : Object.keys(item)
                    .filter(k => attributes.includes(<A>k))
                    .reduce((obj, key) => ({ ...obj, [key]: item[key ]}), {}))) as Pick<ItemMap[T], A>,
        }
    }

    public getAttributeItems<T extends keyof ItemMap, A extends keyof ItemMap[T]>(
        type: T,
        items?: { id?: string, data?: Partial<ItemMap[T]> }[],
        attributes?: A[],
        options?: {
            length?: number | { min: number, max: number }
        }
    ) {
        const length = options?.length != undefined
            ? (typeof options.length === 'number'
                ? options.length
                : _random_int(options.length.min, options.length.max)
            ) : (items != undefined && items.length > 0 ? items.length : _random_int(1, 10))

        return Array.from({ length }, (_, i) => this.getAttributeItem(
            type,
            items?.at(i)?.id ?? this.createId(type),
            items?.at(i)?.data,
            attributes,
        ))
    }

    public filterRelationships<
        T extends Type,
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
                // @ts-expect-error TODO: fix this
                return this.getAttributeItem(item.type, item.id, item.attributes, query.attributes[item.type])
            })
        }
    }
}