import { PatreonCacheStore, type PatreonFetchOptions } from '../../../rest/v2/oauth2/store'
import type { If } from '../../../utils/generics'

import { type ItemMap } from '../item'
import { QueryBuilder } from '../query'

import type {
    Relationship,
    RelationshipFields,
    RelationshipFieldsToItem,
    RelationshipFieldToFieldType,
    RelationshipTypeFields,
} from '../relationships'

type ItemRawRelationship<T extends keyof ItemMap> = Relationship<T, RelationshipFields<T>>['relationships']

type ItemCacheRelationship<T extends keyof ItemMap> = {
    [R in keyof ItemRawRelationship<T>]: (ItemRawRelationship<T>[R]['data'] extends unknown[]
        ? string[]
        : string
    ) | null
}

export type ItemCache<T extends keyof ItemMap> = {
    item: ItemMap[T]
    relationships: ItemCacheRelationship<T>
}

interface ItemCacheOptions {
    id: string
    type: keyof ItemMap
}

type IfAsync<IsAsync extends boolean, T> = If<IsAsync, Promise<T>, T>

interface CacheStore<IsAsync extends boolean> {
    delete (type: keyof ItemMap, id: string): IfAsync<IsAsync, void>
    // bulkDelete (items: { type: keyof ItemMap, id: string }[]): IfAsync<IsAsync, void>
    set <T extends keyof ItemMap>(type: T, id: string, value: ItemCache<T>): IfAsync<IsAsync, void>
    // bulkSet (items: { type: keyof ItemMap, id: string, value: ItemCache<keyof ItemMap> }[]): IfAsync<IsAsync, void>
    edit <T extends keyof ItemMap>(type: T, id: string, value: Partial<ItemMap[T]>): IfAsync<IsAsync, ItemMap[T] | null>
    get <T extends keyof ItemMap> (type: T, id: string): IfAsync<IsAsync, ItemCache<T> | null>
}

type PatreonMockCacheStoreBinding = PatreonFetchOptions<
    ItemCache<keyof ItemMap>,
    ItemCacheOptions,
    false,
    { type: keyof ItemMap, relationships: ItemCacheOptions[] },
    { id: string, value: ItemCache<keyof ItemMap> }
>

export class PatreonMockCacheStore implements CacheStore<false> {
    protected store: PatreonMockCacheStoreBinding

    public constructor (
        store?: PatreonMockCacheStoreBinding,
    ) {
        this.store = store ?? new PatreonCacheStore.Memory({
            getKey: (options) => {
                if (!options) throw new Error()
                return options.type + '/' + options.id
            },
            filter: (key, value, options) => {
                return key.split('/')[0] === options.type && (
                    options.relationships.every(option => {
                        const name = QueryBuilder.convertTypeToRelation(options.type, <never>option.type)

                        const ids = value.relationships[name]
                        return Array.isArray(ids)
                            ? (<string[]>ids).includes(option.id)
                            : ids === option.id
                    })
                )
            },
            toListValue(key, value) {
                return {
                    value: value,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    id: key.split('/')[1]!,
                }
            },
        })
    }

    public delete(type: keyof ItemMap, id: string): If<false, Promise<void>, void> {
        return this.store.delete({ id, type })
    }

    public set<T extends keyof ItemMap>(type: T, id: string, value: ItemCache<T>): If<false, Promise<void>, void> {
        return this.store.put(value, { id, type })
    }

    public edit<T extends keyof ItemMap>(type: T, id: string, value: Partial<ItemMap[T]>): If<false, Promise<ItemMap[T] | null>, ItemMap[T] | null> {
        const item = this.get(type, id)
        if (item == undefined) return null

        const merged = { ...item.item, ...value }
        this.set(type, id, { relationships: item.relationships, item: merged })
        return merged
    }

    public get<T extends keyof ItemMap>(type: T, id: string): If<false, Promise<ItemCache<T> | null>, ItemCache<T> | null> {
        return (this.store.get({ id, type }) ?? null) as ItemCache<T> | null
    }

    public getRelated<
        T extends keyof ItemMap,
        R extends RelationshipFields<T>
    >(type: T, id: string, related: R) {
        const item = this.get(type, id)
        if (item == null) return null

        const relationType = QueryBuilder.convertRelationToType(type, related)
        const ids = item.relationships[related]
        if (ids == null) return null

        return Array.isArray(ids)
            ? { ids: ids as string[], item: ids.map(id => this.get(relationType, id)) }
            : { id: ids as string, item: [this.get(relationType, ids)] }
    }

    public getRelatedToResource <
        T extends keyof ItemMap,
        R extends RelationshipFieldsToItem<T>
    >(resourceType: T, resourceId: string, type: R) {
        return this.store.list({
            type,
            relationships: [{
                id: resourceId,
                type: resourceType,
            }]
        }) as { id: string, value: ItemCache<R> }[]
    }

    public getRelationships <T extends keyof ItemMap> (
        type: T,
        relationships: ItemCache<T>['relationships'],
        onMissingItem: (type: RelationshipTypeFields<T>, id: string, resourceType: T) => void,
    ): Relationship<T, RelationshipFields<T>> & {
        items: {
            [R in RelationshipFields<R>]: {
                id: string
                type: RelationshipFieldToFieldType<T, R>
                item: ItemCache<RelationshipFieldToFieldType<T, R>>
            }
        }[RelationshipFields<T>][]
    } {
        const relationFields = Object.keys(relationships) as RelationshipFields<T>[]
        const relationMap = QueryBuilder.createRelationMap(type)

        return {
            relationships: relationFields.reduce<Relationship<T, RelationshipFields<T>>['relationships']>((obj, key) => {
                const ids = relationships[key]
                return {
                    ...obj,
                    [key]: ids == null ? null : (Array.isArray(ids)
                        ? { data: ids.map(id => ({ id, type: relationMap[key] })) }
                        : { data: { id: ids, type: relationMap[key] }, links: { related: '' } })
                }
            }, {} as never),
            items: relationFields.flatMap(relation => {
                if (relationships[relation] == null) return
                const relationType = relationMap[relation]

                const ids: string[] = Array.isArray(relationships[relation])
                    ? relationships[relation]
                    : [relationships[relation]]

                return ids.map(id => {
                    const item = this.get(relationType, id)

                    if (!item) {
                        onMissingItem(relationType, id, type)
                        return
                    }

                    return {
                        id,
                        type: relationType,
                        item,
                    }
                })
            }).filter((n): n is NonNullable<typeof n> => n != undefined)
        }
    }
}
