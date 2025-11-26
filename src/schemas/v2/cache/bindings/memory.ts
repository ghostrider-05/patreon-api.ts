import type {
    CacheStoreBinding,
} from '../base'

import type { IfAsync } from '../promise'

type MapLikeInterface<K, V> = Pick<Map<K, V>,
    | 'clear'
    | 'delete'
    | 'get'
    | 'keys'
    | 'set'
>

// TODO: make binding with a weak map and Symbol.for?
// Only exposed for testing the binding
export class DefaultBinding<IsAsync extends boolean, Value> implements CacheStoreBinding<IsAsync, Value> {
    protected cache: MapLikeInterface<string, Value> = new Map()

    public get (key: string) {
        return this.cache.get(key) as IfAsync<IsAsync, Value | undefined>
    }

    public delete (key: string) {
        this.cache.delete(key)

        return void 0 as IfAsync<IsAsync, void>
    }

    public put (key: string, value: Value) {
        this.cache.set(key, value)

        return void 0 as IfAsync<IsAsync, void>
    }
}

export default class<IsAsync extends boolean, Value> extends DefaultBinding<IsAsync, Value> implements Required<CacheStoreBinding<IsAsync, Value>> {
    public deleteAll(): IfAsync<IsAsync, void> {
        return this.cache.clear() as IfAsync<IsAsync, void>
    }

    public list<Metadata extends object = object>(options?: {
        prefix?: string;
        getMetadata?: (item: Value) => Metadata
    }): IfAsync<IsAsync, { keys: { key: string; metadata: Metadata }[] }> {
        // Converted to array, as iterator functions are only added in Node.js v22
        const iterator = [...this.cache.keys()]
        const keys = typeof options?.prefix === 'string'
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ? iterator.filter(key => key.startsWith(options.prefix!))
            : iterator

        return {
            keys: keys.map(key => ({
                key,
                // @ts-expect-error Typed as possible promise
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                metadata: <Metadata>options?.getMetadata?.(this.get(key)!)
                    ?? <Metadata>{},
            }))
        } as IfAsync<IsAsync, { keys: { key: string; metadata: Metadata }[] }>
    }

    public bulkDelete(keys: string[]): IfAsync<IsAsync, void> {
        for (const key of keys) {
            this.cache.delete(key)
        }

        return void 0 as IfAsync<IsAsync, void>
    }

    public bulkGet(keys: string[]): IfAsync<IsAsync, ({ key: string, value: Value } | undefined)[]> {
        return keys.map(key => {
            const value = this.cache.get(key)
            if (!value) return undefined

            return {
                value,
                key,
            }
        }) as IfAsync<IsAsync, ({ key: string, value: Value } | undefined)[]>
    }

    public bulkPut(items: { key: string; value: Value }[]): IfAsync<IsAsync, void> {
        for (const { key, value } of items) {
            this.cache.set(key, value)
        }

        return void 0 as IfAsync<IsAsync, void>
    }
}
