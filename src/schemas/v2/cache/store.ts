import { RequestMethod } from '../../../rest/v2'
import { isListingPayload } from '../../../payloads/v2'

import {
    type AttributeItem,
    type ItemMap,
    type ItemType,
} from '../item'

import type {
    WriteResourcePayload,
    WriteResourceResponse,
    WriteResourceType,
} from '../modifiable'

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
} from '../relationships'

import type {
    CacheStore as ICacheStore,
    CacheStoreBinding,
    CacheStoreConvertOptions,
    CacheItem,
    CacheSearchOptions,
} from './base'

import {
    type IfAsync,
} from './promise'

import {
    CacheStoreShared,
    type CacheStoreSharedOptions,
} from './shared'

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

export interface CacheStoreOptions extends CacheStoreSharedOptions {
    convert?: CacheStoreConvertOptions<CacheSearchOptions>
    events?: NodeJS.EventEmitter<CacheStoreEventMap> | undefined
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

export class CacheStore<IsAsync extends boolean>
    extends CacheStoreShared<IsAsync, CacheItem<ItemType>>
    implements Required<ICacheStore<IsAsync, { type: ItemType, id: string }>>
{
    public override options: Required<Omit<CacheStoreOptions, 'events' | 'initial'>>
        & Pick<CacheStoreOptions, 'events'>

    public constructor (
        async: IsAsync,
        binding?: CacheStoreBinding<IsAsync, CacheItem<ItemType>>,
        options?: CacheStoreOptions,
    ) {
        super(async, binding, options)

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
                }),
                toMetadata: (value: CacheItem<ItemType>) => value.relationships,
            },
        }

        this.promise.consume(this.bulkPut(options?.initial ?? []), () => {
            this.options.events?.emit('ready')
        })
    }

    // ---- binding methods ----

    // @ts-expect-error expanded override
    public override delete(type: ItemType, id: string) {
        return super.delete(this.options.convert.toKey({ type, id }))
    }

    // @ts-expect-error expanded override
    public override put<T extends ItemType>(type: T, id: string, value: CacheItem<T>) {
        return super.put(this.options.convert.toKey({ type, id }), value)
    }

    // @ts-expect-error Generic overwrite
    public override edit<T extends ItemType>(type: T, id: string, value: Partial<ItemMap[T]>) {
        return super.edit(this.options.convert.toKey({ id, type }), (stored) => ({
            item: { ...(stored?.item ?? {}), ...value },
            relationships: stored?.relationships ?? {},
        })) as IfAsync<IsAsync, CacheItem<T> | undefined>
    }

    // @ts-expect-error Generic overwrite
    public override get<T extends ItemType>(type: T, id: string) {
        return this.binding.get(this.options.convert.toKey({ type, id })) as IfAsync<IsAsync, CacheItem<T> | undefined>
    }

    // @ts-expect-error expanded override
    public override bulkPut<T extends ItemType>(items: {
        type: T
        id: string
        value: CacheItem<T>
    }[]): IfAsync<IsAsync, void> {
        const keys = items.map(item => ({
            key: this.options.convert.toKey(item),
            value: item.value,
        }))

        return super.bulkPut(keys)
    }

    // @ts-expect-error Generic overwrite
    public override bulkGet<T extends ItemType> (items: {
        type: T
        id: string
    }[]): IfAsync<IsAsync, ({ id: string, value: CacheItem<T> } | undefined)[]> {
        const keys = items.map(item => this.options.convert.toKey(item))

        return super.bulkGet(keys) as IfAsync<IsAsync, ({ id: string, value: CacheItem<T> } | undefined)[]>
    }

    // @ts-expect-error expanded override
    public override bulkDelete(items: {
        type: ItemType
        id: string
    }[]): IfAsync<IsAsync, void> {
        const keys = items.map(item => this.options.convert.toKey(item))

        return super.bulkDelete(keys)
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
        // onMissingItem: (type: RelationshipTypeFields<T>, id: string, resourceType: T) => void,
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
                        if (this.options.events?.listenerCount('missingItem')) {
                            this.options.events.emit('missingItem')
                        }

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

    // ---- resource methods ----

    public getResource <T extends ItemType>(type: T, id: string): IfAsync<IsAsync, {
        data: { attributes: Partial<ItemMap[T]> } & Relationship<T, RelationshipFields<T>>
        included: {
            [R in RelationshipFields<R>]: {
                id: string
                type: RelationshipFieldToFieldType<T, R>
                item: CacheItem<RelationshipFieldToFieldType<T, R>>
            }
        }[RelationshipFields<T>][]
    } | undefined> {
        return this.promise.consume(this.get(type, id), (item) => {
            if (!item) return undefined

            return this.promise.chain(this.getRelationships(type, item.relationships), (relations) => {
                return {
                    data: {
                        attributes: item.item,
                        relationships: relations.relationships,
                    },
                    included: relations.items,
                }
            })
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
            if (request.pathId == null) {
                throw new Error('Missing id of resource ' + request.pathResource + ' to delete in cache')
            }

            return this.delete(request.pathResource, request.pathId)
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
