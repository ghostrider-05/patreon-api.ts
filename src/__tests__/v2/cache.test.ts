import { describe, expect, test } from 'vitest'

import {
    CacheStoreShared,
    CacheTokenStore,
} from '../../v2'

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
        expect(syncCache.get('unknown')).toBeUndefined()
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

        const keys = pairs.map(p => p.key)

        syncCache.bulkPut(pairs)
        syncCache.bulkPut([])
        expect(syncCache.bulkGet(keys)).toEqual(pairs)
        syncCache.bulkDelete(keys)
        expect(syncCache.bulkGet(keys)).toEqual(keys.map(() => undefined))
    })
})

describe('token cache', () => {
    test('read a token', () => {
        const cache = new CacheTokenStore(true)

        expect(cache.get('creator_token')).toBeUndefined()
    })
})
