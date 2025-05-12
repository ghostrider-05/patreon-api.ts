import { BasePatreonQuery, GetResponsePayload, RequestMethod } from '../../../rest/v2'
import { isListingPayload } from '../../../v2'
import { AttributeItem, type ItemMap, type ItemType } from '../item'
import { WriteResourcePayload, WriteResourceResponse, WriteResourceType } from '../modifiable'

import { QueryBuilder } from '../query'

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

export class CacheStore<IsAsync extends boolean> implements Required<ICacheStore<IsAsync>> {
    private promise: PromiseManager<IsAsync>

    public binding: CacheStoreBinding<IsAsync>
    public options: Required<Omit<CacheStoreOptions, 'events' | 'initial'>>
        & Pick<CacheStoreOptions, 'events'>

    public constructor (
        binding: CacheStoreBinding<IsAsync> | undefined,
        protected async: IsAsync,
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

        this.binding = binding ?? (new CacheStoreBindingMemory({
            convert: this.options.convert,
        }) as unknown as CacheStoreBinding<IsAsync>)
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

    public edit<T extends ItemType>(type: T, id: string, value: Partial<ItemMap[T]>) {
        return this.promise.consume(this.get(type, id), (item) => {
            if (item == undefined && !this.options.patchUnknownItem) return undefined
            const merged = { ...(item?.item ?? {}), ...value } as ItemMap[T]

            return this.promise.chain(this.put(type, id, { relationships: item?.relationships, item: merged }), () => {
                return merged
            })
        })
    }

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

    public bulkGet<T extends ItemType> (items: {
        type: T
        id: string
    }[]): IfAsync<IsAsync, (CacheItem<T> | undefined)[]> {
        if (this.binding.bulkGet != undefined) {
            return this.binding.bulkGet(items.map(item => {
                return this.options.convert.toKey(item)
            })) as IfAsync<IsAsync, (CacheItem<T> | undefined)[]>
        }

        return this.promise.consume(this.promise.all(items.map(item => {
            return this.get(item.type, item.id)
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
        return this.binding.list([{
            type,
            relationships: [{
                id: resourceId,
                type: resourceType,
            }]
        }]) as IfAsync<IsAsync, { id: string; value: CacheItem<T> }[]>
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
                    relationships: attributeItem.relationships,
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
