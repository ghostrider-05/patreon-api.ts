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
            return keys.map(key => content[key])
        },
        list: (options) => {
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