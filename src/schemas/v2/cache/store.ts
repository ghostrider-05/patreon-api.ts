import { RequestMethod } from '../../../rest/v2'
import { isListingPayload } from '../../../v2'
import { AttributeItem, type ItemMap, type ItemType } from '../item'
import { WriteResourcePayload, WriteResourceResponse, WriteResourceType } from '../modifiable'

import {
    QueryBuilder,
    BasePatreonQuery,
    GetResponsePayload,
} from '../query'

import type {
    Relationship,
    RelationshipFields,
    RelationshipFieldsToItem,
    RelationshipFieldToFieldType,
    RelationshipTypeFields,
} from '../relationships'

import type {
    CacheStore as ICacheStore,
    CacheStoreBinding,
    CacheStoreSearchConvertOptions,
    CacheItem,
    CacheSearchOptions,
} from './base'

import {
    CacheStoreBindingMemory,
} from './bindings/'

import {
    PromiseManager,
    type IfAsync,
} from './promise'

export interface CacheStoreEventMap {
    ready: []
    missingRelationship: []
    missingItem: []
}

// interface Sweeper {
//     lifetime: number
//     interval: number
//     filter: (item) => boolean
// }

// interface Limits {
//     maxSize: number
// }

export interface CacheStoreOptions {
    convert?: CacheStoreSearchConvertOptions
    events?: NodeJS.EventEmitter<CacheStoreEventMap> | undefined
    patchUnknownItem?: boolean
    requests?: {
        mockAttributes?: {
            [T in WriteResourceType]: Partial<{
                [M in RequestMethod]: (body: WriteResourcePayload<T, M>) => WriteResourceResponse<T>
            }>
        }
        //urlParser?: {}
    }
    // sweepers?: {}
    // limits?: {}
    initial?: {
        id: string
        type: ItemType
        value: CacheItem<ItemType>
    }[]
}

export class CacheStore<IsAsync extends boolean> implements Required<ICacheStore<IsAsync, { type: ItemType, id: string }>> {
    private promise: PromiseManager<IsAsync>

    public binding: CacheStoreBinding<IsAsync, CacheItem<ItemType>>
    public options: Required<Omit<CacheStoreOptions, 'events' | 'initial'>>
        & Pick<CacheStoreOptions, 'events'>

    public static createSync (
        binding?: CacheStoreBinding<false, CacheItem<ItemType>>,
        options?: CacheStoreOptions,
    ) {
        return new CacheStore(false, binding, options)
    }

    public static createAsync (
        binding?: CacheStoreBinding<true, CacheItem<ItemType>>,
        options?: CacheStoreOptions,
    ) {
        return new CacheStore(true, binding, options)
    }

    public constructor (
        protected async: IsAsync,
        binding?: CacheStoreBinding<IsAsync, CacheItem<ItemType>>,
        options?: CacheStoreOptions,
    ) {
        this.options = {
            events: options?.events,
            requests: options?.requests ?? {},
            patchUnknownItem: options?.patchUnknownItem ?? true,
            convert: {
                toKey: options?.convert?.toKey ?? ((options) => options.type + '/' + options.id),
                fromKey: options?.convert?.fromKey ?? ((key) => {
                    const [type, id] = key.split('/')
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    return { type: type! as ItemType, id: id! }
                })
            },
        }

        this.binding = binding ?? (new CacheStoreBindingMemory<CacheItem<ItemType>>({
            convert: this.options.convert,
        }, (value) => value.relationships) as unknown as CacheStoreBinding<IsAsync, CacheItem<ItemType>>)
        this.promise = new PromiseManager(async)

        this.promise.consume(this.bulkPut(options?.initial ?? []), () => {
            this.options.events?.emit('ready')
        })
    }

    // ---- binding methods ----

    public delete(type: ItemType, id: string) {
        return this.binding.delete(this.options.convert.toKey({ type, id }))
    }

    public put<T extends ItemType>(type: T, id: string, value: CacheItem<T>) {
        return this.binding.put(this.options.convert.toKey({ type, id }), value)
    }

    // @ts-expect-error Generic overwrite
    public edit<T extends ItemType>(type: T, id: string, value: Partial<ItemMap[T]>) {
        return this.promise.consume(this.get(type, id), (item) => {
            if (item == undefined && !this.options.patchUnknownItem) return undefined
            const merged = { ...(item?.item ?? {}), ...value } as ItemMap[T]

            return this.promise.chain(this.put(type, id, { relationships: item?.relationships ?? {}, item: merged }), () => {
                return merged
            })
        })
    }

    // @ts-expect-error Generic overwrite
    public get<T extends ItemType>(type: T, id: string) {
        return this.binding.get(this.options.convert.toKey({ type, id })) as IfAsync<IsAsync, CacheItem<T> | undefined>
    }

    public bulkPut<T extends ItemType>(items: {
        type: T
        id: string
        value: CacheItem<T>
    }[]): IfAsync<IsAsync, void> {
        if (items.length === 0) {
            return undefined as IfAsync<IsAsync, void>
        }

        if (this.binding.bulkPut != undefined) {
            return this.binding.bulkPut(items.map(item => ({
                value: item.value,
                key: this.options.convert.toKey({
                    id: item.id,
                    type: item.type,
                })
            })))
        }

        return this.promise.consume(this.promise.all(
            items.map(item => this.put(item.type, item.id, item.value))
        ), () => {})
    }

    // @ts-expect-error Generic overwrite
    public bulkGet<T extends ItemType> (items: {
        type: T
        id: string
    }[]): IfAsync<IsAsync, ({ id: string, value: CacheItem<T> } | undefined)[]> {
        if (this.binding.bulkGet != undefined) {
            return this.binding.bulkGet(items.map(item => {
                return this.options.convert.toKey(item)
            })) as IfAsync<IsAsync, ({ id: string, value: CacheItem<T> } | undefined)[]>
        }

        return this.promise.consume(this.promise.all(items.map(item => {
            return this.promise.consume(this.get(item.type, item.id), value => {
                return value ? { value, id: item.id } : undefined
            })
        })), (result) => result)
    }

    public bulkDelete(items: {
        type: ItemType
        id: string
    }[]): IfAsync<IsAsync, void> {
        if (this.binding.bulkDelete != undefined) {
            return this.binding.bulkDelete(items.map(item => {
                return this.options.convert.toKey(item)
            }))
        }

        return this.promise.consume(this.promise.all(items.map(({ id, type }) => {
            return this.delete(type, id)
        })), () => {})
    }

    // ---- relationship methods ----

    public list(options: {
        type: ItemType
        relationships: CacheSearchOptions[]
    }[]): IfAsync<IsAsync, { id: string; type: ItemType }[]> {
        const uniqueTypes: ItemType[] = [...new Set(options.map(t => t.type))]
        const keys = this.promise.all(uniqueTypes.map(prefix => this.binding.list({ prefix })))

        return this.promise.consume(keys, lists => {
            return lists.flatMap(list => list.keys.filter(item => {
                return options.some(option => {
                    const isSameType = this.options.convert.fromKey(item.key).type === option.type

                    return isSameType && option.relationships.every(rel => {
                        const relValue = item.metadata[rel.type]

                        if (typeof rel.id === 'string' && !relValue) return false
                        else if (relValue == null && rel.id == null) return true
                        else return Array.isArray(relValue)
                            ? relValue.includes(rel.id)
                            : relValue === rel.id
                    })
                })
            }).map(item => this.options.convert.fromKey(item.key)))
        })
    }

    public getRelated<
        T extends keyof ItemMap,
        R extends RelationshipFields<T>
    >(type: T, id: string, related: R) {
        return this.promise.consume(this.get(type, id), (result) => {
            if (result == undefined) return undefined

            const relationType = QueryBuilder.convertRelationToType(type, related)
            const ids = result.relationships[related]
            if (ids == null) return null
            const stringIds = <string[]>(Array.isArray(ids) ? ids : [ids])

            return this.promise.chain(this.promise.all(stringIds.map(id => this.get(relationType, id))), (result) => {
                return Array.isArray(ids)
                    ? { ids: ids as string[], item: result }
                    : { id: ids as string, item: result }
            })
        })
    }

    public getRelatedToResource <
        T extends keyof ItemMap,
        R extends RelationshipFieldsToItem<T>
    >(resourceType: T, resourceId: string, type: R) {
        return this.list([{
            type,
            relationships: [{
                id: resourceId,
                type: resourceType,
            }]
        }]) as IfAsync<IsAsync, { id: string; type: R }[]>
    }

    public getRelationships <T extends keyof ItemMap> (
        type: T,
        relationships: CacheItem<T>['relationships'],
        onMissingItem: (type: RelationshipTypeFields<T>, id: string, resourceType: T) => void,
    ): IfAsync<IsAsync, Relationship<T, RelationshipFields<T>> & {
        items: {
            [R in RelationshipFields<R>]: {
                id: string
                type: RelationshipFieldToFieldType<T, R>
                item: CacheItem<RelationshipFieldToFieldType<T, R>>
            }
        }[RelationshipFields<T>][]
    }> {
        const relationFields = Object.keys(relationships) as RelationshipFields<T>[]
        const relationMap = QueryBuilder.createRelationMap(type)

        return this.promise.consume(this.promise.all(relationFields.flatMap(relation => {
            if (relationships[relation] == null) return []
            const relationType = relationMap[relation]

            const ids: string[] = Array.isArray(relationships[relation])
                ? relationships[relation]
                : [relationships[relation]]

            return ids.map(id => {
                return this.promise.consume(this.get(relationType, id), (item => {
                    if (!item) {
                        onMissingItem(relationType, id, type)
                        return
                    }

                    return {
                        id,
                        type: relationType,
                        item,
                    }
                }))
            })
        })), (items) => {
            return {
                items: items.filter((n): n is NonNullable<typeof n> => n != undefined),
                relationships: relationFields.reduce<Relationship<T, RelationshipFields<T>>['relationships']>((obj, key) => {
                    const ids = relationships[key]
                    return {
                        ...obj,
                        [key]: ids == null ? null : (Array.isArray(ids)
                            ? { data: ids.map(id => ({ id, type: relationMap[key] })) }
                            : { data: { id: ids, type: relationMap[key] }, links: { related: '' } })
                    }
                }, {} as never),
            }
        })
    }

    public syncResource <T extends ItemType, R extends RelationshipFields<T>> (
        attributeItem: AttributeItem<T, Partial<ItemMap[T]>> & Partial<Relationship<T, R>>,
    ): IfAsync<IsAsync, void> {
        const { id, type, attributes } = attributeItem

        // TODO: sync relationships

        return this.promise.consume(this.get(type, id), (item => {
            if (item != undefined) {
                return this.promise.chain(this.edit(type, id, attributes), () => {})
            } else {
                return this.promise.chain(this.put(type, id, {
                    item: attributes,
                    relationships: attributeItem.relationships ?? {},
                }), () => {})
            }
        }))
    }

    public syncRequest <T extends BasePatreonQuery>(
        request: {
            method: RequestMethod
            pathId: string | null
            pathResource: ItemType
            //body: WriteResourcePayload<WriteResourceType, RequestMethod> | null
        },
        responsePayload: GetResponsePayload<T> | null,
    ) {
        if (request.method === RequestMethod.Delete) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.delete(request.pathResource, request.pathId!)
        }

        if (responsePayload == null) {
            throw new Error()
        }

        if (isListingPayload(responsePayload)) {
            return this.promise.consume(this.promise.all(responsePayload.data.map(item => {
                return this.syncResource(item)
            })), () => {})
        } else {
            return this.syncResource(responsePayload.data)
        }
    }
}
