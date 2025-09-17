import { describe, expect, test } from 'vitest'

import {
    CacheStoreShared,
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
})
