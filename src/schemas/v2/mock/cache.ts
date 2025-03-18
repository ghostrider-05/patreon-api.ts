import { RequestMethod } from '../../../v2'
import { Type, type ItemMap } from '../item'
import type {
    WriteResourcePayload,
    WriteResourceType,
} from '../modifiable'

import type {
    Relationship,
    RelationshipFields,
    RelationshipFieldsToItem,
    RelationshipItem,
    RelationshipMap,
} from '../relationships'

import { PatreonMockCacheStore, type ItemCache } from './cache_store'

export interface PatreonMockCacheOptions {
    initial?: {
        [K in keyof ItemMap]?: Map<string, ItemCache<K>>
    }
    onMissingRelationship?: 'error' | 'warn'
}

type ModifyCacheHook = {
    [T in WriteResourceType]: {
        [RequestMethod.Delete]: () => void
        [RequestMethod.Post]: (body: WriteResourcePayload<T, RequestMethod.Post>) => {
            cache: ItemCache<T>
            id: string
        }
        [RequestMethod.Patch]: (stored: ItemCache<T> | null, body: WriteResourcePayload<T, RequestMethod.Patch>) => {
            cache: ItemCache<T> | null
        }
    }
}

export class PatreonMockCache {
    public store: PatreonMockCacheStore

    private onMissinRelationship: 'warn' | 'error' | undefined
    private onModify: ModifyCacheHook = {
        webhook: {
            [RequestMethod.Delete]() {},
            [RequestMethod.Patch](stored, body) {
                if (stored == null) return { cache: null }

                return {
                    cache: {
                        item: {
                            ...stored.item,
                            ...body.data.attributes,
                        },
                        relationships: stored.relationships,
                    }
                }
            },
            [RequestMethod.Post]: (body) => {
                const { id } = this.onPostRequest(Type.Webhook)

                return {
                    id,
                    cache: {
                        item: {
                            ...body.data.attributes,
                            paused: false,
                            last_attempted_at: <never>null,
                            num_consecutive_times_failed: 0,
                            secret: '', // TODO: generate
                        },
                        relationships: {
                            campaign: body.data.relationships.campaign.data?.id ?? null,
                            client: null,
                        }
                    }
                }
            },
        }
    }

    public constructor (
        options: PatreonMockCacheOptions,
        private onPostRequest: (type: Type) => {
            id: string
        }
    ) {
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
        item: ItemCache<T>,
    ): Relationship<T, RelationshipFields<T>> & {
        included: RelationshipItem<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>>[]
    } {
        const converted = this.store.getRelationships(type, item.relationships, (type, id, resource) => {
            const message = `Unable to find relationship ${type} (${id}) on ${resource}`

            if (this.onMissinRelationship === 'error') throw new Error(message)
            if (this.onMissinRelationship === 'warn') console.warn(message)
        })

        return {
            relationships: converted.relationships,
            included: converted.items.map(({ id, item, type }) => ({
                id,
                type,
                attributes: item.item,
            })),
        }
    }

    public get <T extends keyof ItemMap>(type: T, id: string): (Relationship<T, RelationshipFields<T>> & {
        attributes: ItemMap[T]
        included: RelationshipItem<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>>[]
        id: string
    }) | null {
        const item = this.store.get(type, id)
        if (item == null) return null

        return {
            id,
            attributes: item.item,
            ...this.getRelations(type, item),
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
                const related = this.getRelations(relatedType, value)

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

    /**
     * For requests that change the storage, sync the request body with the cache
     * @param method The request method. Must be one of: delete, patch, post
     * @param type The type of resource. Only types that allow write requests are allowed
     * @param id The id of the resource (the path parameter). For post requests this can be undefined.
     * @param body The request body (stringified JSON). For delete requests this can be undefined.
     * @returns A promise for async storage
     * @throws When a parameter is undefined, but required for a request method.
     */
    public setRequestBody <T extends WriteResourceType>(method: string, type: T, id: string | undefined, body?: string) {
        if (method.toLowerCase() === 'delete') {
            if (id == undefined) throw new Error()
            this.onModify[type][RequestMethod.Delete]()

            return this.store.delete(type, id)
        }

        if (body == undefined) throw new Error()

        if (method.toLowerCase() === 'post') {
            const payload: WriteResourcePayload<T, RequestMethod.Post> = JSON.parse(body)
            const { cache, id } = this.onModify[type][RequestMethod.Post](payload)

            return this.store.set(type, id, cache)
        }

        if (method.toLowerCase() === 'patch') {
            const payload: WriteResourcePayload<T, RequestMethod.Patch> = JSON.parse(body)
            const current = this.store.get(type, payload.data.id)

            const { cache } = this.onModify[type][RequestMethod.Patch](current, payload)

            if (cache != null) {
                return this.store.set(type, payload.data.id, cache)
            }
        }
    }
}
