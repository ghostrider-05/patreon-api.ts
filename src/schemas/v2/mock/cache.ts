import { type ItemMap, Type } from '../item'

import type {
    Relationship,
    RelationshipFields,
    RelationshipFieldsToItem,
    RelationshipItem,
    RelationshipMap,
} from '../relationships'

import { PatreonMockCacheStore } from './cache_store'

type ItemRawRelationship<T extends keyof ItemMap> = Relationship<T, RelationshipFields<T>>['relationships']

type ItemCacheRelationship<T extends keyof ItemMap> = {
    [R in keyof ItemRawRelationship<T>]: ItemRawRelationship<T>[R]['data'] extends unknown[]
        ? string[]
        : string
}

type ItemCache<T extends keyof ItemMap> = {
    item: ItemMap[T]
    relationships: ItemCacheRelationship<T>
}

export interface PatreonMockCacheOptions {
    initial?: {
        [K in keyof ItemMap]?: Map<string, ItemCache<K>>
    }
    onMissingRelationship?: 'error' | 'warn'
}

export class PatreonMockCache {
    public address: Map<string, ItemCache<'address'>> = new Map()
    public benefit: Map<string, ItemCache<'benefit'>> = new Map()
    public campaign: Map<string, ItemCache<'campaign'>> = new Map()
    public client: Map<string, ItemCache<'client'>> = new Map()
    public deliverable: Map<string, ItemCache<'deliverable'>> = new Map()
    public goal: Map<string, ItemCache<'goal'>> = new Map()
    public media: Map<string, ItemCache<'media'>> = new Map()
    public member: Map<string, ItemCache<'member'>> = new Map()
    public post: Map<string, ItemCache<'post'>> = new Map()
    public tier: Map<string, ItemCache<'tier'>> = new Map()
    public user: Map<string, ItemCache<'user'>> = new Map()
    public webhook: Map<string, ItemCache<'webhook'>> = new Map()
    public 'pledge-event': Map<string, ItemCache<Type.PledgeEvent>> = new Map()

    public store: PatreonMockCacheStore

    private onMissinRelationship: 'warn' | 'error' | undefined

    public constructor (options: PatreonMockCacheOptions) {
        if (options.initial != undefined) {
            this.setAll(options.initial)
        }

        this.onMissinRelationship = options.onMissingRelationship

        this.store = new PatreonMockCacheStore()
    }

    protected setAll (items: NonNullable<PatreonMockCacheOptions['initial']>): void {
        for (const [type, item] of Object.entries(items)) {
            for (const [id, value] of Object.entries(item)) {
                this.store.set(type as keyof ItemMap, id, value)
            }
        }
    }

    public getRelations <T extends keyof ItemMap>(
        type: T,
        relationship: ItemCacheRelationship<T>,
    ): Relationship<T, RelationshipFields<T>> & {
        included: RelationshipItem<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>>[]
    } {
        const converted = this.store.getRelationships(type, relationship)

        return {
            relationships: converted.relationships,
            included: converted.items.map(({ id, type, item }) => {
                if (item == null) {
                    const message = `Unable to find relationship ${type} (${id}) on ${type} (${id})`

                    if (this.onMissinRelationship === 'error') throw new Error(message)
                    if (this.onMissinRelationship === 'warn') console.warn(message)

                    return undefined
                }

                return {
                    attributes: item.item,
                    type,
                    id,
                }
            }).filter((item): item is NonNullable<typeof item> => item != undefined)
        }
    }

    public get <T extends keyof ItemMap>(type: T, id: string): (Relationship<T, RelationshipFields<T>> & {
        attributes: ItemMap[T]
        included: RelationshipItem<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>>[]
        id: string
    }) | null {
        const item = this.store.get(type, id)
        if (item == null) return null

        const { item: resource, relationships } = item
        const relations = this.getRelations(type, relationships)

        return {
            id,
            attributes: resource,
            ...relations,
        }
    }

    public getRelated <
        T extends keyof ItemMap,
        R extends RelationshipFieldsToItem<T>,
    >(type: T, id: string, relatedType: R): {
        data: (Relationship<T, RelationshipFields<T>> & {
            attributes: ItemMap[R]
            id: string
            type: R
        })[]
        included: RelationshipItem<R, RelationshipFields<R>, RelationshipMap<R, RelationshipFields<R>>>[]
        combined: {
            item: Relationship<R, RelationshipFields<R>> & {
                attributes: ItemMap[R]
                id: string
                type: R
            }
            included: RelationshipItem<R, RelationshipFields<R>, RelationshipMap<R, RelationshipFields<R>>>[]
        }[]
    } | null {
        const items = this.store.getRelatedToResource(type, id, relatedType)
            .map(({ id, value }) => {
                const related = this.getRelations(relatedType, value.relationships)

                return {
                    item: {
                        type: relatedType,
                        id,
                        attributes: value.item,
                        relationships: related.relationships,
                    },
                    included: related.included,
                }
            })

        return {
            included: items.flatMap(item => item.included),
            data: items.flatMap(({ item }) => item),
            combined: items.map(item => ({ type: relatedType, ...item })),
        }
    }
}
