import { randomUUID } from 'node:crypto'

import {
    QueryBuilder,
    type ItemMap,
    type Relationship,
    type RelationshipFields,
    type RelationshipItem,
    type RelationshipMap,
    type Type,
} from '..'

import type { ListRequestPayload } from '../../../payloads/v2/internals/list'
import type { GetRequestPayload } from '../../../payloads/v2/internals/get'

import type { RandomDataGenerator } from './random'
import RandomDataResources from '../generated/random'

export interface PatreonMockDataOptions {
    resources?: Partial<{ [T in keyof ItemMap]: (id: string) => Partial<ItemMap[T]> }>
    random?: Partial<RandomDataGenerator>
}

interface MockDataManager {
    randomGenerators: RandomDataGenerator
    random: RandomDataResources

    createId: (type: Type) => string
    createAPIUrl (type: keyof ItemMap, id: string): string

    getAttributeItem<T extends Type, A extends keyof ItemMap[T]>(type: T, id?: string, data?: Partial<ItemMap[T]>, attributes?: A[]): {
        id: string
        type: T
        attributes: Pick<ItemMap[T], A>
    }

    getRelationships<T extends Type, I extends RelationshipFields<T>, A extends RelationshipMap<T, I>>(
        type: T,
        items: RelationshipItem<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>>[],
        query: {
            includes: I[]
            attributes: A
        }
    ): {
        included: RelationshipItem<T, I, A>[]
    } & Relationship<T, I>

    getSingleResponsePayload<T extends Type, I extends RelationshipFields<T>, A extends RelationshipMap<T, I>>(
        type: T,
        query: {
            includes: I[]
            attributes: A
        },
        data: {
            id: string
            item: Partial<ItemMap[T]>
            relatedItems: RelationshipItem<T, I, A>[]
        },
    ): GetRequestPayload<T, I, A>

    getListResponsePayload<T extends Type, I extends RelationshipFields<T>, A extends RelationshipMap<T, I>>(
        type: T,
        query: {
            includes: I[]
            attributes: A
        },
        data: {
            items: {
                id: string
                item: Partial<ItemMap[T]>
                relatedItems: RelationshipItem<T, I, A>[]
            }[]
        },
    ): ListRequestPayload<T, I, A>
}

const _random = <T>(list: T[]): T => list[list.length * Math.random() | 0] as T

export class PatreonMockData implements MockDataManager {
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
            const { included, relationships } = this.getRelationships(type, data.relatedItems, query)

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
                id: string
                item: Partial<ItemMap[T]>
                relatedItems: RelationshipItem<T, I, A>[]
            }[]
        },
    ): ListRequestPayload<T, I, A> {
        const items = data.items.map(({ id, item }) => {
            return this.getAttributeItem(type, id, item, query.attributes[type] as (keyof ItemMap[T])[] ?? [])
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
            const mappedItems = data.items.map(({ id, item, relatedItems }) => {
                const { included, relationships } = this.getRelationships(type, relatedItems, query)
                const attributes = this.getAttributeItem(type, id, item, query.attributes[type] as (keyof ItemMap[T])[] ?? [])

                return {
                    item: {
                        ...attributes,
                        relationships,
                    },
                    included,
                }
            })

            return {
                data: mappedItems.map(item => item.item),
                included: mappedItems.map(item => item.included).flat(),
                meta,
            }
        }
    }

    public createId (type: Type): string {
        if (type === 'member') return randomUUID()
        else return ''
    }

    public createAPIUrl (type: keyof ItemMap, id: string): string {
        return `https://patreon.com/api/oauth2/v2/${type}/${id}`
    }

    // public createRelatedItems (type: keyof ItemMap, length: number) {}

    public getAttributeItem<T extends keyof ItemMap, A extends keyof ItemMap[T]>(
        type: T,
        id: string,
        data?: Partial<ItemMap[T]>,
        attributes?: A[],
    ) {
        const item = { ...this.random[type](id), ...(data ?? {}) }

        return {
            type,
            id,
            attributes: (attributes == undefined || attributes.length === 0
                ? {}
                : Object.keys(item)
                    .filter(k => attributes.includes(<A>k))
                    .reduce((obj, key) => ({ ...obj, [key]: item[key ]}), {})) as Pick<ItemMap[T], A>,
        }
    }

    public getRelationships<
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

            return {
                ...obj,
                [relation]: rel.type === 'item'
                    ? {
                        // @ts-expect-error TODO: fix this
                        data: { type: rel.resource, id: items[0].id },
                        // @ts-expect-error TODO: fix this
                        links: { related: this.createAPIUrl(rel.resource, items[0].id) },
                    } : {
                        data: items.map(i => ({ type: i.type, id: i.id })),
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