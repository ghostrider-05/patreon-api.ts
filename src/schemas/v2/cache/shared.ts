import type { CacheStoreBinding } from './base'
import { type IfAsync, PromiseManager } from './promise'

import { CacheStoreBindingMemory } from './bindings/'

export interface CacheStoreSharedOptions {
    /**
     * When editing an item, store the new attributes when no item is found.
     * Otherwise, the item will not be updated.
     * @default true
     */
    patchUnknownItem?: boolean
}

export class CacheStoreShared<IsAsync extends boolean, Value> {
    protected async: IsAsync
    protected promise: PromiseManager<IsAsync>

    public binding: CacheStoreBinding<IsAsync, Value>
    public options: Required<CacheStoreSharedOptions>

    public constructor (
        async: IsAsync,
        binding?: CacheStoreBinding<IsAsync, Value>,
        options?: CacheStoreSharedOptions,
    ) {
        this.async = async
        this.binding = binding ?? (new CacheStoreBindingMemory<Value>() as unknown as CacheStoreBinding<IsAsync, Value>)
        this.promise = new PromiseManager(async)

        this.options = {
            patchUnknownItem: options?.patchUnknownItem ?? true,
        }
    }

    public delete(key: string): IfAsync<IsAsync, void> {
        return this.binding.delete(key)
    }

    public put(key: string, token: Value): IfAsync<IsAsync, void> {
        return this.binding.put(key, token)
    }

    public get(key: string): IfAsync<IsAsync, Value | undefined> {
        return this.binding.get(key)
    }

    public edit(key: string, value: Partial<Value> | ((item: Value | undefined) => Value)) {
        return this.promise.consume(this.get(key), (item) => {
            if (item == undefined && !this.options.patchUnknownItem) return undefined
            const merged = typeof value === 'function'
                ? value(item)
                : { ...(item ?? {}), ...value } as Value

            return this.promise.chain(this.put(key, merged), () => {
                return merged
            })
        })
    }

    public bulkPut(items: { key: string; value: Value }[]): IfAsync<IsAsync, void> {
        if (items.length === 0) {
            return undefined as IfAsync<IsAsync, void>
        }

        if (this.binding.bulkPut != undefined) {
            return this.binding.bulkPut(items)
        }

        return this.promise.consume(this.promise.all(items.map(({ key, value }) => {
            return this.binding.put(key, value)
        })), () => {})
    }

    public bulkGet(keys: string[]): IfAsync<IsAsync, ({ id: string, value: Value } | undefined)[]> {
        if (keys.length === 0) {
            return [] as IfAsync<IsAsync, never[]>
        }

        if (this.binding.bulkGet != undefined) {
            return this.binding.bulkGet(keys)
        }

        return this.promise.consume(this.promise.all(keys.map(key => {
            return this.promise.consume(this.get(key), value => {
                return value ? { value, id: key } : undefined
            })
        })), result => result)
    }

    public bulkDelete(keys: string[]): IfAsync<IsAsync, void> {
        if (keys.length === 0) {
            return undefined as IfAsync<IsAsync, void>
        }

        if (this.binding.bulkDelete != undefined) {
            return this.binding.bulkDelete(keys)
        }

        return this.promise.consume(this.promise.all(keys.map(key => {
            return this.delete(key)
        })), () => {})
    }

    public static createSync<Value, Store extends typeof CacheStoreShared<false, Value>>(
        store: Store,
        binding?: CacheStoreBinding<false, Value>,
        options?: Partial<typeof store['prototype']['options']>,
    ) {
        return new store(false, binding, options)
    }

    public static createAsync<Value, Store extends typeof CacheStoreShared<true, Value>>(
        store: Store,
        binding?: CacheStoreBinding<true, Value>,
        options?: Partial<typeof store['prototype']['options']>,
    ) {
        return new store(true, binding, options)
    }
}
