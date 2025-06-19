/* eslint-disable jsdoc/check-param-names */
import type {
    RelationshipData,
} from '../../../payloads/v2/normalized/find'

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

import {
    QueryBuilder,
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
    /**
     * Emitted when the initial items have been stored in the cache
     */
    ready: []
    missingItem: [type: ItemType, id: string]
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

export interface CacheStoreOptions extends CacheStoreSharedOptions {
    events?: NodeJS.EventEmitter<CacheStoreEventMap> | undefined
    requests?: {
        mockAttributes?: {
            [T in WriteResourceType]: Partial<{
                [M in RequestMethod]: (body: WriteResourcePayload<T, M>) => WriteResourceResponse<T>
            }>
        }
        syncOptions?: {
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
        & { convert: CacheStoreConvertOptions<CacheSearchOptions> }

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
                toKey: (options) => options.type + '/' + options.id,
                fromKey: (key) => {
                    const [type, id] = key.split('/')
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    return { type: type! as ItemType, id: id! }
                },
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

    private convertFromRelationships<T extends ItemType, R extends RelationshipFields<T>> (
        relationships: Relationship<T, R>['relationships']
    ): CacheItem<T>['relationships'] {
        return Object.entries<Relationship<T, R>['relationships']>(relationships).reduce((output, [key, value]) => {
            const data = value['data'] as RelationshipData<T, R>

            return {
                ...output,
                [key]: data == null ? null : (Array.isArray(data) ? data.map(d => d.id) : data.id)
            }
        }, {})
    }

    private convertToRelationships <T extends ItemType>(
        type: T,
        relationships: CacheItem<T>['relationships'],
    ): Relationship<T, RelationshipFields<T>> & {
        fields: RelationshipFields<T>[]
        map: { [R in RelationshipFields<T>]: RelationshipFieldToFieldType<T, R> }
    } {
        const relationFields = Object.keys(relationships) as RelationshipFields<T>[]
        const relationMap = QueryBuilder.createRelationMap(type)

        return {
            fields: relationFields,
            map: relationMap,
            relationships: relationFields.reduce<Relationship<T, RelationshipFields<T>>['relationships']>((obj, key) => {
                const ids = relationships[key]
                return {
                    ...obj,
                    [key]: ids == null ? null : (Array.isArray(ids)
                        ? { data: ids.map(id => ({ id, type: relationMap[key] })) }
                        : { data: { id: ids, type: relationMap[key] }, links: { related: '' } })
                }
            }, {} as never)
        }
    }

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
            const converted = this.convertToRelationships(type, result.relationships)

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
    ): IfAsync<IsAsync, Relationship<T, RelationshipFields<T>> & {
        items: {
            [R in RelationshipFields<R>]: {
                id: string
                type: RelationshipFieldToFieldType<T, R>
                item: CacheItem<RelationshipFieldToFieldType<T, R>>
            }
        }[RelationshipFields<T>][]
    }> {
        const converted = this.convertToRelationships(type, relationships)

        return this.promise.consume(this.promise.all(converted.fields.flatMap(relation => {
            if (relationships[relation] == null) return []
            const relationType = converted.map[relation]

            const ids: string[] = Array.isArray(relationships[relation])
                ? relationships[relation]
                : [relationships[relation]]

            return ids.map(id => {
                return this.promise.consume(this.get(relationType, id), (item => {
                    if (!item) {
                        if (this.options.events?.listenerCount('missingItem')) {
                            this.options.events.emit('missingItem', relationType, id)
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
                relationships: converted.relationships,
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

        return this.promise.consume(this.get(type, id), (item => {
            return this.promise.chain(this.put(type, id, {
                item: {
                    ...(item?.item ?? {}),
                    ...attributes,
                },
                relationships: {
                    ...(item?.relationships ?? {}),
                    ...(attributeItem.relationships
                        ? this.convertFromRelationships(attributeItem.relationships)
                        : {}
                    ),
                },
            }), () => {})
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
     * @throws when `path.id` is `null`. For `POST` requests, use the new id as path id
     * @throws when the request body is `null` for non-`DELETE` requests
     * @throws when `options.requests.syncOptions.requireMockAttributes` is `true` and no mock attributes are generated.
     */
    public syncRequest (
        request: {
            method: RequestMethod
            body: WriteResourcePayload<WriteResourceType, RequestMethod> | null
        },
        path: {
            id: string | null
            resource: WriteResourceType
        }
    ): IfAsync<IsAsync, void> {
        const { mockAttributes, syncOptions } = this.options.requests
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

        const mockedAttributes = mockAttributes?.[path.resource]?.[request.method]?.(request.body)

        if (mockedAttributes == undefined) {
            if (this.options.events?.listenerCount('missingMockedAttributes')) {
                this.options.events.emit('missingMockedAttributes', path)
            }

            if (syncOptions?.requireMockAttributes) {
                throw new Error('Failed to find mocked attributes for resource: ' + path.resource)
            }

            // enable checking later again
            return this.syncResource(<never>{ ...(<object>request.body.data), id: path.id })
        } else {
            return this.syncResource({ ...mockedAttributes.data, id: path.id })
        }
    }
}
