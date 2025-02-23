import { PatreonCacheStore } from '../../../rest/v2/oauth2/store'

import { type ItemMap, Type } from '../item'
import { QueryBuilder } from '../query'

import type {
    Relationship,
    RelationshipFields,
    RelationshipFieldToFieldType,
    RelationshipItem,
    RelationshipMap,
} from '../relationships'

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

type MockCache = {
    [K in keyof ItemMap]: Map<string, ItemCache<K>>
}

export interface PatreonMockCacheOptions {
    initial?: Partial<MockCache>
    onMissingRelationship?: 'error' | 'warn'
}

// eslint-disable-next-line jsdoc/require-jsdoc
function mergeMaps <K, V>(from: Map<K, V>, to: Map<K, V>) {
    for (const [key, value] of from.entries()) {
        to.set(key, value)
    }
}

export class PatreonMockCache implements MockCache {
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

    public store = new PatreonCacheStore.Memory<ItemCache<'address'>, { id: string }>(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (options) => options!.id
    )

    private onMissinRelationship: 'warn' | 'error' | undefined

    public constructor (options: PatreonMockCacheOptions) {
        if (options.initial != undefined) {
            this.setAll(options.initial)
        }

        this.onMissinRelationship = options.onMissingRelationship
    }

    private getRelationMap <T extends keyof ItemMap>(type: T) {
        const resource = QueryBuilder['getResource']<T>(type).relationships

        return resource.reduce((obj, relation) => ({
            [relation.name]: relation.resource,
            ...obj,
        }))
    }

    private getCache <T extends keyof ItemMap>(type: T): Map<string, ItemCache<T>> {
        return this[type] as Map<string, ItemCache<T>>
    }

    private convertRelationshipsFromCache <T extends keyof ItemMap>(type: T, cached: ItemCacheRelationship<T>) {
        const relationMap = this.getRelationMap(type)
        const relationFields = Object.keys(cached) as (keyof typeof cached)[]

        return {
            relationships: relationFields.reduce<Relationship<T, RelationshipFields<T>>['relationships']>((obj, key) => {
                return {
                    ...obj,
                    [key]: Array.isArray(cached[key])
                        ? { data: cached[key].map(id => ({ id, type: relationMap[key] })) }
                        : { data: { id: cached[key], type: relationMap[key] }, links: { related: '' } }
                }
            }, {} as never),
            items: relationFields.flatMap(relation => {
                const relationType = relationMap[relation]

                const ids: string[] = Array.isArray(cached[relation])
                    ? cached[relation]
                    : [cached[relation]]

                return ids.map(id => ({ id, type: relationType }))
            })
        }
    }

    public getRelations <T extends keyof ItemMap>(
        type: T,
        relationship: ItemCacheRelationship<T>,
    ): Relationship<T, RelationshipFields<T>> & {
        included: RelationshipItem<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>>[]
    } {
        const converted = this.convertRelationshipsFromCache(type, relationship)

        return {
            relationships: converted.relationships,
            included: converted.items.map(({ id, type }) => {
                const item = this.getCache(type).get(id)

                if (item == undefined) {
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
        const item = this.getCache(type).get(id)
        if (item == undefined) return null

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
        R extends RelationshipFieldToFieldType<T, RelationshipFields<T>>
    >(type: T, id: string, relatedType: R): {
        data: (Relationship<T, RelationshipFields<T>> & {
            attributes: ItemMap[T]
            id: string
            type: R
        })[]
        included: RelationshipItem<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>>[]
        combined: (Relationship<R, RelationshipFields<R>> & {
            attributes: ItemMap[R]
            id: string
            type: R
            included: RelationshipItem<R, RelationshipFields<R>, RelationshipMap<R, RelationshipFields<R>>>[]
        })[]
    } | null {
        const item = this.getCache(type).get(id)
        if (item == undefined) return null

        const { relationships } = item
        const converted = this.convertRelationshipsFromCache(type, relationships).items
            .filter((item): item is typeof item & { type: R } => item.type === relatedType)

        const items = converted.map(item => this.get(relatedType, item.id))
            .filter((n): n is NonNullable<typeof n> => n != null)

        return {
            included: items.flatMap(item => item.included),
            data: items.flatMap(item => ({
                relationships: item.relationships,
                attributes: item.attributes,
                type: relatedType,
                id: item.id,
            })),
            combined: items.map(item => ({ type: relatedType, ...item })),
        }

    }

    protected setAll (items: Partial<MockCache>): void {
        for (const [type, item] of Object.entries(items)) {
            mergeMaps(item, this.getCache(type as keyof ItemMap))
        }
    }

    public clearAll (): void {
        for (const type of Object.values(Type)) {
            this[type].clear()
        }
    }

    public edit <T extends keyof ItemMap>(type: T, id: string, data: Partial<ItemMap[T]>) {
        const item = this[type].get(id)
        if (!item) return undefined

        const merged = {
            ...item.item,
            ...data,
        } as ItemMap[T]

        // @ts-expect-error something needs to be fixed
        this[type].set(id, {
            item: merged,
            relationships: item.relationships,
        } as ItemCache<T>)

        return merged as ItemMap[T]
    }
}
