/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-dynamic-delete */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// region file-cache
import { CacheStore, CacheStoreBinding } from 'patreon-api.ts'
import { readFile, writeFile } from 'node:fs/promises'
import { type PathLike } from 'node:fs'

const cacheFileBinding = <T>(path: PathLike, parser: {
    parse: (content: string) => Record<string, T>
    stringify: (content: Record<string, T>) => string
}): CacheStoreBinding<true, T> => {
    const _readFile = () => readFile(path, { encoding: 'utf8'})
        .then(content => parser.parse(content))
    const _writeFile = (content: Record<string, T>) => writeFile(path, parser.stringify(content), { encoding: 'utf8' })

    return {
        get: async (key) =>{
            const content = await _readFile()
            return content[key]
        },
        delete: async (key) => {
            const content = await _readFile()
            delete content[key]
            await _writeFile(content)
        },
        put: async (key, value) => {
            const content = await _readFile()
            await _writeFile({ ...content, [key]: value })
        },
    }
}

const cache = new CacheStore(true, cacheFileBinding('./cache.json', JSON))
// endregion file-cache
// region file-cache-sync
import { CacheStore, CacheStoreBinding } from 'patreon-api.ts'
import { readFileSync, writeFileSync, type PathLike } from 'node:fs'

const cacheFileSyncBinding = <T>(path: PathLike, parser: {
    parse: (content: string) => Record<string, T>
    stringify: (content: Record<string, T>) => string
}): CacheStoreBinding<false, T> => {
    const _readFile = () => parser.parse(readFileSync(path, { encoding: 'utf8'}))
    const _writeFile = (content: Record<string, T>) => writeFileSync(path, parser.stringify(content), { encoding: 'utf8' })

    return {
        get: (key) =>{
            return _readFile()[key]
        },
        delete: (key) => {
            const content = _readFile()
            delete content[key]
            _writeFile(content)
        },
        put: (key, value) => {
            const content = _readFile()
            _writeFile({ ...content, [key]: value })
        },
    }
}

const cache = new CacheStore(false, cacheFileSyncBinding('./cache.json', JSON))
// endregion file-cache-sync
// region file-cache-all
import { CacheStore, CacheStoreBinding } from 'patreon-api.ts'
import { readFile, writeFile } from 'node:fs/promises'
import { type PathLike } from 'node:fs'

const cacheFileBinding = <T>(path: PathLike, parser: {
    parse: (content: string) => Record<string, T>
    stringify: (content: Record<string, T>) => string
}): CacheStoreBinding<true, T> => {
    const _readFile = () => readFile(path, { encoding: 'utf8'})
        .then(content => parser.parse(content))
    const _writeFile = (content: Record<string, T>) => writeFile(path, parser.stringify(content), { encoding: 'utf8' })

    return {
        get: async (key) =>{
            const content = await _readFile()
            return content[key]
        },
        delete: async (key) => {
            const content = await _readFile()
            delete content[key]
            await _writeFile(content)
        },
        put: async (key, value) => {
            const content = await _readFile()
            await _writeFile({ ...content, [key]: value })
        },
        bulkDelete: async (keys) => {
            const content = await _readFile()
            for (const key of keys) {
                delete content[key]
            }
            await _writeFile(content)
        },
        bulkPut: async (items) => {
            const content = await _readFile()
            await _writeFile({ ...content, ...Object.fromEntries(items) })
        },
        bulkGet: async (keys) => {
            const content = await _readFile()
            return keys.map(key => ({ value: content[key], key }))
        },
        list: async (options) => {
            const content = await _readFile()
            const entries = Object.entries(content)
                .filter(([key]) => options?.prefix ? key.startsWith(options.prefix) : true)

            return {
                keys: entries.map(([key, value]) => ({
                    key,
                    metadata: options?.getMetadata?.(value) ?? {},
                })),
            }
        },
        deleteAll: () => _writeFile({}),
    }
}

const cache = new CacheStore(true, cacheFileBinding('./cache.json', JSON))
// endregion file-cache-all
// region store-tokens
import { PatreonCreatorClient, CacheTokenStore, type RestEventMap } from 'patreon-api.ts'
import { EventEmitter } from 'node:stream'

declare const env: {
    CLIENT_ID: string
    CLIENT_SECRET: string
}

class Client extends PatreonCreatorClient {
    // Configure async/sync store and the binding depending on the storage used
    // Without a binding, it stores in memory. Configure the binding for other storage providers (SQL, KV, etc)
    public tokenCache = new CacheTokenStore(false)
}

const emitter = new EventEmitter<RestEventMap>()

const client = new Client({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
    },
    rest: {
        emitter,
    }
})

emitter.on('response', async ({ response }) => {
    // Refresh the creator token when a 401 response is received
    if (response.status === 401) {
        // Get the token
        const currentToken = client.tokenCache.get('token')
        if (!currentToken) return console.log('No token to refresh')
        const refreshedToken = await client.oauth.refreshToken(currentToken)

        // Save it your DB
        client.tokenCache.put('token', refreshedToken)
        // Update the token on the client
        client.oauth.cachedToken = refreshedToken
    }
})
// endregion store-tokens
// region store-custom
import { CacheStoreShared } from 'patreon-api.ts'

interface CustomValue { value: string }
class CustomCache<IsAsync extends boolean> extends CacheStoreShared<IsAsync, CustomValue, { id: string }> {
    public constructor (async: IsAsync) {
        // Optionally, define a custom  default binding or whether this is a sync/async cache
        super(async, undefined, {
            // Define conversion handlers for custom key format.
            // This can be typed in the generics above.
            convert: {
                fromKey: (key) => ({ id: key }),
                toKey: (id) => id,
                toKeyFromObject: (options) => options.id,
            },
        })
    }
}
// endregion store-custom
