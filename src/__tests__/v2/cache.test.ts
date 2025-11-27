import EventEmitter from 'node:events'

import { describe, expect, test } from 'vitest'

import {
    CacheItem,
    CacheStore,
    CacheStoreEventMap,
    CacheStoreShared,
    CacheTokenStore,
    RequestMethod,
    Type,
} from '../../v2'

import { DefaultBinding } from '../../schemas/v2/cache/bindings/memory'
import { RelationshipsUtils } from '../../schemas/v2/cache/base'

describe('relationships util', () => {
    const original = {
        benefits: { data: null },
        tiers: { data: [{ id: 'tier_id', type: <const>Type.Tier }] },
        creator: { data: { id: 'creator_id', type: <const>Type.User }, links: { related: '' } },
    }

    const stringified = {
        benefits: null,
        tiers: ['tier_id'],
        creator: 'creator_id',
    }

    test('stringify', () => {
        expect(RelationshipsUtils.stringify<'campaign', 'benefits' | 'creator' | 'tiers'>(original)).toEqual(stringified)
    })

    test('parse', () => {
        expect(RelationshipsUtils.parse('campaign', stringified).relationships).toEqual(original)
    })
})

describe('shared cache', () => {
    const syncCache = new CacheStoreShared<false, string>(false, undefined, {})

    test('options', () => {
        expect(syncCache.options.patchUnknownItem).toEqual(false)
    })

    test('cache factory', () => {
        class CustomCache<IsAsync extends boolean> extends CacheStoreShared<IsAsync, { value: string }> {}

        const sync = CacheStoreShared.createSync(CustomCache<false>)
        const async = CacheStoreShared.createAsync(CustomCache<true>)
    
        expect(sync).toBeInstanceOf(CustomCache)
        expect(async).toBeInstanceOf(CustomCache)
    })

    test('item read', () => {
        const id = '_id', value = 'cached value'

        syncCache.put(id, value)
        expect(syncCache.get(id)).toEqual(value)
        expect(syncCache.get('unknown_value')).toBeUndefined()
    })

    test('item edit', () => {
        const id = '_id'

        expect(syncCache.edit(id, 'new value')).toEqual('new value')
        expect(syncCache.get(id)).toEqual('new value')
    })

    test('item delete', () => {
        const id = '_id'

        syncCache.put(id, 'new value')
        syncCache.delete(id)
        expect(syncCache.get(id)).toBeUndefined()
    })

    test('bulk operations', () => {
        const pairs = Array.from({ length: 10 }, (_, i) => ({
            key: i.toString(),
            value: i.toString(),
        }))

        const keys = pairs.map(p => ({ key: p.key }))

        syncCache.bulkPut(pairs)

        syncCache.bulkPut([])
        expect(syncCache.bulkDelete([])).toBeUndefined()
        expect(syncCache.bulkGet([])).toEqual([])

        expect(syncCache.bulkGet(keys)).toEqual(pairs)
        syncCache.bulkDelete(keys)
        expect(syncCache.bulkGet(keys)).toEqual(keys.map(() => undefined))
    })

    test('bulk operations: no binding methods', () => {
        const syncCache = new CacheStoreShared<false, string>(false, new DefaultBinding<false, string>(), {})

        const pairs = Array.from({ length: 10 }, (_, i) => ({
            key: i.toString(),
            value: i.toString(),
        }))

        const keys = pairs.map(p => ({ key: p.key }))

        syncCache.bulkPut(pairs)

        syncCache.bulkPut([])
        expect(syncCache.bulkDelete([])).toBeUndefined()
        expect(syncCache.bulkGet([])).toEqual([])

        expect(syncCache.bulkGet(keys)).toEqual(pairs)
        syncCache.bulkDelete(keys)
        expect(syncCache.bulkGet(keys)).toEqual(keys.map(() => undefined))
    })

    test('bulk operations: delete all', () => {
        const binding = new CacheStoreShared<false, string>(false)
        const limitedBinding = new CacheStoreShared<false, string>(false, new DefaultBinding<false, string>(), {})

        const pairs = Array.from({ length: 10 }, (_, i) => ({
            key: i.toString(),
            value: i.toString(),
        }))

        const keys = pairs.map(p => ({ key: p.key }))

        binding.bulkPut(pairs)
        limitedBinding.bulkPut(pairs)

        binding.deleteAll()
        limitedBinding.deleteAll()

        expect(limitedBinding.bulkGet(keys)).toEqual(pairs)
        expect(binding.bulkGet(keys)).toEqual(keys.map(() => undefined))
    })
})

describe('token cache', () => {
    test('read a token', () => {
        const cache = new CacheTokenStore(true)

        expect(cache.get('creator_token')).toBeUndefined()
    })
})

describe('item cache', () => {
    test('with initial items', async () => {
        let isReady = false

        const events = new EventEmitter<CacheStoreEventMap>()
        events.on('ready', () => { isReady = true })

        const store = new CacheStore(true, undefined, {
            events,
            initial: [{
                id: 'id',
                type: 'campaign',
                relationships: {},
                item: {
                    is_monthly: true,
                },
            }]
        })

        while (!isReady) {
            await new Promise(resolve => setTimeout(resolve, 10))
        }

        expect(await store.get('campaign', 'id')).toBeDefined()
        expect(await store.bulkGet([{ id: 'id', type: 'campaign' }])).toEqual([{
            key: 'campaign/id',
            value: {
                id: 'id',
                type: 'campaign',
                item: {
                    is_monthly: true,
                },
                relationships: {},
            },
        }])
    })

    describe('shared binding methods', () => {
        const cache = new CacheStore(true)

        test('edit', async () => {
            await cache.put('campaign', 'campaign_id', {
                item: { is_monthly: true, patron_count: 1 },
                relationships: {
                    benefits: null,
                    creator: 'user_id',
                },
            })

            const result = await cache.edit('campaign', 'campaign_id', {
                is_monthly: false,
                is_charged_immediately: true,
            })

            expect(result).toEqual({
                item: {
                    is_monthly: false,
                    is_charged_immediately: true,
                    patron_count: 1,
                },
                relationships: {
                    benefits: null,
                    creator: 'user_id',
                },
            })
        })
    })

    describe('Sync methods', () => {
        const cache = new CacheStore(true, undefined, {
            initial: [{
                id: 'campaign_id',
                type: 'campaign',
                item: { is_monthly: true },
                relationships: { creator: 'user_id' },
            }],
        })

        test('sync resource', async () => {
            await cache.syncResource({
                type: 'campaign',
                id: 'campaign_id',
                attributes: { is_charged_immediately: true },
                relationships: { benefits: { data: null } },
            })

            const resource = await cache.getResource('campaign', 'campaign_id')
            expect(resource).toEqual({
                data: {
                    attributes: {
                        is_monthly: true,
                        is_charged_immediately: true,
                    },
                    relationships: {
                        benefits: { data: null },
                        creator: { 
                            data: { type: 'user', id: 'user_id' },
                            links: { related: '' },
                        },
                    },
                },
                included: [],
            })
        })

        test('sync resource with relationship', async () => {
            await cache.syncResource({
                type: 'campaign',
                id: 'campaign_id',
                attributes: { is_charged_immediately: true },
                relationships: { benefits: { data: null } },
            })

            await cache.syncResource({
                type: 'user',
                id: 'user_id',
                attributes: { is_creator: true },
            })

            const resource = await cache.getResource('campaign', 'campaign_id')
            expect(resource).toEqual({
                data: {
                    attributes: {
                        is_monthly: true,
                        is_charged_immediately: true,
                    },
                    relationships: {
                        benefits: { data: null },
                        creator: { 
                            data: { type: 'user', id: 'user_id' },
                            links: { related: '' },
                        },
                    },
                },
                included: [{
                    type: 'user',
                    id: 'user_id',
                    item: {
                        item: { is_creator: true },
                        relationships: {},
                    } satisfies CacheItem<'user'>
                }],
            })
        })

        test('sync request: GET request', async () => {
            await cache.syncRequest(
                { body: null, method: RequestMethod.Get },
                { id: 'webhook_id', resource: Type.Webhook }
            )

            const item = await cache.get('webhook', 'webhook_id')
            expect(item).toBeUndefined()
        })

        test('sync request: POST request with no body', async () => {
            await expect(async () => await cache.syncRequest(
                { body: null, method: RequestMethod.Post },
                { id: 'webhook_id', resource: Type.Webhook }
            )).rejects.toThrow('Missing request body to sync with cache')
        })

        test('sync request: POST request with no id', async () => {
            await expect(async () => await cache.syncRequest(
                { body: null, method: RequestMethod.Post },
                { id: <never>null, resource: Type.Webhook }
            )).rejects.toThrow('Missing id of resource webhook to update in cache')
        })

        test('sync request: POST request with no mocked attributes', async () => {
            const cache = new CacheStore(true, undefined, {
                requestSyncOptions: {
                    requireMockAttributes: true,
                },
            })

            await expect(async () => await cache.syncRequest(
                { body: { data: {
                    type: Type.Webhook,
                    attributes: {
                        triggers: [],
                        uri: 'https://mywebsite.com',
                    },
                    relationships: {
                        campaign: {
                            data: {
                                id: 'campaign_id',
                                type: Type.Campaign,
                            }
                        }
                    }
                } }, method: RequestMethod.Post },
                { id: 'webhook_id', resource: Type.Webhook }
            )).rejects.toThrow('Failed to find mocked attributes for resource: webhook')
        })

        test('sync request: DELETE request', async () => {
            await cache.syncResource({
                type: 'webhook',
                id: 'webhook_id_1',
                attributes: { secret: 'secret' },
            })

            const resource = await cache.get('webhook', 'webhook_id_1')
            expect(resource).toBeDefined()

            await cache.syncRequest(
                { body: null, method: RequestMethod.Delete },
                { id: 'webhook_id_1', resource: Type.Webhook }
            )

            const item = await cache.get('webhook', 'webhook_id_1')
            expect(item).toBeUndefined()
        })
    })
})
