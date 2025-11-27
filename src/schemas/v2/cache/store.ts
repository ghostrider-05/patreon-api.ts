/* eslint-disable jsdoc/check-param-names */
import { RequestMethod } from '../../../rest/v2'

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

import type {
    Relationship,
    RelationshipFields,
    RelationshipFieldsToItem,
    RelationshipFieldToFieldType,
} from '../relationships'

import {
    RelationshipsUtils,
    type CacheStoreBinding,
    type CacheItem,
} from './base'

import {
    type IfAsync,
} from './promise'

import {
    CacheStoreShared,
    type CacheStoreSharedOptions,
} from './shared'

export interface CacheStoreEventMap {
    /**
     * Emitted when the initial items have been stored in the cache
     */
    ready: []

    /**
     * Emitted when an item is not found in the cache
     */
    missingItem: [type: ItemType, id: string]

    /**
     * Emitted when a request has no mocked attributes for a method.
     */
    missingMockedAttributes: [
        path: {
            id: string | null
            resource: WriteResourceType
        },
    ]
}

// interface Sweeper {
//     lifetime: number
//     interval: number
//     filter: (item) => boolean
// }

// interface Limits {
//     maxSize: number
// }

export interface CacheStoreItem<T extends ItemType> extends CacheItem<T> {
    type: T
    id: string
}

export interface CacheStoreOptions extends Omit<CacheStoreSharedOptions<{ type: ItemType; id: string }>, 'convert'> {
    events?: NodeJS.EventEmitter<CacheStoreEventMap> | undefined
    requestSyncOptions?: {
        /**
         * Throw an error if no mocked attributes are generated.
         * @default false
         */
        requireMockAttributes?: boolean
        /**
         * The allowed request methods used for syncing requests
         * @default ['DELETE', 'POST', 'PATCH']
         */
        allowedMethods?: RequestMethod[]
    }
    // sweepers?: {}
    // limits?: {}
    initial?: {
        [T in ItemType]: CacheStoreItem<T>
    }[ItemType][]
}

export class CacheStore<IsAsync extends boolean>
    extends CacheStoreShared<IsAsync, CacheItem<ItemType>, { type: ItemType; id: string }> {
    public override options: Required<Omit<CacheStoreOptions, 'events' | 'initial'>>
        & Pick<CacheStoreOptions, 'events'>
        & Required<Pick<CacheStoreSharedOptions<{ type: ItemType; id: string }>, 'convert'>>

    public constructor (
        async: IsAsync,
        binding?: CacheStoreBinding<IsAsync, CacheItem<ItemType>>,
        options?: CacheStoreOptions,
    ) {
        const parentOptions: Required<CacheStoreSharedOptions<{ type: ItemType; id: string }>> = {
            patchUnknownItem: options?.patchUnknownItem ?? false,
            convert: {
                toKeyFromObject: (options) => options.type + '/' + options.id,
                toKey: (type, id) => type + '/' + id,
                fromKey: (key) => {
                    const [type, id] = key.split('/')
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    return { type: type! as ItemType, id: id! }
                },
            }
        }

        super(async, binding, parentOptions)

        this.options = {
            events: options?.events,
            requestSyncOptions: options?.requestSyncOptions ?? {},
            ...parentOptions,
        }

        this.promise.consume(this.bulkPut(options?.initial ?? []), () => {
            this.options.events?.emit('ready')
        })
    }

    // ---- binding methods ----

    public override put<T extends ItemType>(type: T, id: string, value: CacheItem<T>) {
        return super.put(type, id, value)
    }

    public override edit<T extends ItemType>(type: T, id: string, value: Partial<ItemMap[T]>) {
        return super.edit(type, id, (stored) => ({
            item: { ...(stored?.item ?? {}), ...value },
            relationships: stored?.relationships ?? {},
        })) as IfAsync<IsAsync, CacheItem<T> | undefined>
    }

    public override get<T extends ItemType>(type: T, id: string) {
        return super.get(type, id) as IfAsync<IsAsync, CacheItem<T> | undefined>
    }

    // @ts-expect-error Incorrect overwrite
    public override bulkPut<T extends ItemType>(items: CacheStoreItem<T>[]): IfAsync<IsAsync, void> {
        const keys = items.map(item => {
            const { id, type, ...value } = item

            return {
                type,
                id,
                value,
            }
        })

        return super.bulkPut(keys)
    }

    public override bulkGet<T extends ItemType> (items: {
        type: T
        id: string
    }[]): IfAsync<IsAsync, ({ key: string, value: CacheStoreItem<T> } | undefined)[]> {
        return this.promise.consume(super.bulkGet(items), items => items.map(item => {
            if (!item) return undefined
            const { type, id } = this.options.convert.fromKey(item.key)
            return {
                key: item.key,
                value: {
                    item: item.value.item,
                    relationships: item.value.relationships,
                    type,
                    id,
                }
            }
        })) as IfAsync<IsAsync, ({
            key: string
            value: CacheStoreItem<T>
        } | undefined)[]>
    }

    // ---- relationship methods ----

    /**
     * List all resources (with certain relationships) of a resource type
     * If the binding has no list method implemented, an empty array is always returned.
     * @param options The resources to list, optionally with required relationships to other resources/ types.
     * @returns The matched ids + type combinations for the resources in the cache.
     */
    public list(options: {
        type: ItemType
        relationships: { id: string | null; type: ItemType }[]
    }[]): IfAsync<IsAsync, { id: string; type: ItemType }[]> {
        if (this.binding.list == undefined) return [] as IfAsync<IsAsync, []>

        const uniqueTypes: ItemType[] = [...new Set(options.map(t => t.type))]
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const keys = this.promise.all(uniqueTypes.map(prefix => this.binding.list!({
            prefix,
            getMetadata: (item) => item.relationships,
        })))

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

    /**
     * Get the item(s) in a resource for a relationship
     * @param type The type of the resource
     * @param id The id of the resource
     * @param related The relation name to get
     * @returns
     * - `undefined` when the resource is not found
     * - `null` when the relationship is not defined on the resource
     * - `items` can have undefined items, that item is not in the cache found.
     */
    public getRelated<
        T extends keyof ItemMap,
        R extends RelationshipFields<T>
    >(type: T, id: string, related: R): IfAsync<IsAsync,
        | { type: 'item', items: { value: CacheItem<RelationshipFieldToFieldType<T, R>> | undefined, id: string }[] }
        | { type: 'array', items: { value: CacheItem<RelationshipFieldToFieldType<T, R>> | undefined, id: string }[] }
        | null
        | undefined
    > {
        return this.promise.consume(this.get(type, id), (result) => {
            if (result == undefined) return undefined
            const converted = RelationshipsUtils.parse(type, result.relationships)

            const ids = result.relationships[related]
            if (ids == null) return null

            if (Array.isArray(ids)) {
                return this.promise.chain(this.promise.all(ids.map(id => {
                    return this.get<RelationshipFieldToFieldType<T, R>>(converted.map[related], id)
                })), (items) => {
                    return {
                        type: 'array',
                        items: items.map((value, index) => ({
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            id: ids[index]!,
                            value,
                        }))
                    }
                })
            } else {
                return this.promise.chain(
                    this.get<RelationshipFieldToFieldType<T, R>>(converted.map[related], ids),
                    (item) => ({
                        type: 'item',
                        items: [{
                            id: <string>ids,
                            value: item,
                        }],
                    })
                )
            }
        })
    }

    /**
     * Get all items in the cache related to an item.
     * If no `list` method is present on the binding, an empty array will always be returned.
     * @param resourceId The id of the original item
     * @param resourceType The type of the original item
     * @param type The type of the related items to search
     * @returns A list of `type` resources
     */
    public getRelatedToResource<
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

    public getRelationships<T extends keyof ItemMap> (
        type: T,
        relationships: CacheItem<T>['relationships'],
    ): IfAsync<IsAsync, Relationship<T, RelationshipFields<T>> & {
        items: {
            [R in RelationshipFields<R>]: {
                id: string
                type: RelationshipFieldToFieldType<T, R>
                item: CacheItem<RelationshipFieldToFieldType<T, R>>
            }
        }[RelationshipFields<T>][]
    }> {
        const converted = RelationshipsUtils.parse(type, relationships)

        return this.promise.consume(this.promise.all(converted.fields.flatMap(relation => {
            if (relationships[relation] == null) return []
            const relationType = converted.map[relation]

            const ids: string[] = Array.isArray(relationships[relation])
                ? relationships[relation]
                : [relationships[relation]]

            return ids.map(id => {
                return this.promise.consume(this.get(relationType, id), (item => {
                    if (!item) {
                        this.options.events?.emit('missingItem', relationType, id)
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
                relationships: converted.relationships,
            }
        })
    }

    // ---- resource methods ----

    public getResource<T extends ItemType> (type: T, id: string): IfAsync<IsAsync, {
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

    /**
     * Synchronize a resource with the cache.
     * This method is used by {@link syncRequest}
     * @param attributeItem The item with attributes (and relationships)
     * @returns a promise for async storage
     */
    public syncResource<T extends ItemType, R extends RelationshipFields<T>> (
        attributeItem: AttributeItem<T, Partial<ItemMap[T]>> & Partial<Relationship<T, R>>,
    ): IfAsync<IsAsync, void> {
        const { id, type, attributes } = attributeItem

        return this.promise.consume(this.get(type, id), (item => {
            return this.promise.chain(this.put(type, id, {
                item: {
                    ...(item?.item ?? {}),
                    ...attributes,
                },
                relationships: {
                    ...(item?.relationships ?? {}),
                    ...(attributeItem.relationships
                        ? RelationshipsUtils.stringify<T, R>(attributeItem.relationships)
                        : {}
                    ),
                },
            }), () => { })
        }))
    }

    // eslint-disable-next-line jsdoc/require-returns, jsdoc/require-param
    /**
     * Sync the request body to the cache, updating the resource with the changes. For the following methods actions are done:
     * - `DELETE`: delete the resource in the cache
     * - `PATCH`: updates the resource (attributes and relationships)
     * - `POST`: creates the resource in the cache
     * @param request The request data
     * @param path Path data extracted from the API route
     * @throws {Error} when `path.id` is `null`. For `POST` requests, use the new id as path id
     * @throws {Error} when the request body is `null` for non-`DELETE` requests
     * @throws {Error} when `options.requests.syncOptions.requireMockAttributes` is `true` and no mock attributes are generated.
     */
    public syncRequest<
        R extends RequestMethod = RequestMethod,
        T extends WriteResourceType = WriteResourceType,
    > (
        request: {
            method: R
            body: WriteResourcePayload<T, R> | null
        },
        path: {
            id: string
            resource: T
            mockAttributes?: Partial<{
                [M in RequestMethod]: (body: WriteResourcePayload<T, M>) => WriteResourceResponse<T>
            }>
        }
    ): IfAsync<IsAsync, void> {
        const syncOptions = this.options.requestSyncOptions
        const allowedMethods = syncOptions?.allowedMethods
            ?? [RequestMethod.Delete, RequestMethod.Patch, RequestMethod.Post]

        if (allowedMethods != undefined && !allowedMethods.includes(request.method)) {
            return void 0 as IfAsync<IsAsync, void>
        }

        if (path.id == null) {
            throw new Error('Missing id of resource ' + path.resource + ' to update in cache')
        }

        if (request.method === RequestMethod.Delete) {
            return this.delete(path.resource, path.id)
        }

        if (request.body == null) {
            throw new Error('Missing request body to sync with cache')
        }

        const mockedAttributes = path.mockAttributes?.[path.resource]?.[<RequestMethod>request.method]?.(request.body)

        if (mockedAttributes != undefined) {
            return this.syncResource({ ...mockedAttributes.data, id: path.id })
        }

        this.options.events?.emit('missingMockedAttributes', path)

        if (syncOptions?.requireMockAttributes) {
            throw new Error('Failed to find mocked attributes for resource: ' + path.resource)
        }

        // enable checking later again
        return this.syncResource(<never>{ ...(<object>request.body.data), id: path.id })
    }
}
