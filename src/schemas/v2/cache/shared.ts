import type { CacheStoreBinding, CacheStoreConvertOptions } from './base'
import { type IfAsync, PromiseManager } from './promise'

import { CacheStoreBindingMemory } from './bindings/'

import type { ObjValueTuple } from '../../../utils/fields'

// eslint-disable-next-line jsdoc/require-jsdoc
function getLastTupleValue <T extends unknown[], L>(tuple: [...T, L]) {
    return {
        values: <T>tuple.slice(0, -1),
        last: <L>tuple.at(-1),
    }
}

export interface CacheStoreSharedOptions<
    C extends Record<string, unknown> = Record<string, unknown>
> {
    /**
     * When editing an item, store the new attributes when no item is found.
     * Otherwise, the item will not be updated.
     * @default false
     */
    patchUnknownItem?: boolean

    convert?: CacheStoreConvertOptions<C>
}

export class CacheStoreShared<
    IsAsync extends boolean,
    Value,
    C extends Record<string, unknown> = { key: string },
> {
    protected async: IsAsync
    protected promise: PromiseManager<IsAsync>

    public binding: CacheStoreBinding<IsAsync, Value>

    /**
     * Options for the cache.
     * Can be used to control how the cache behaves on edits
     * or other options for custom cache items.
     */
    public options: Required<CacheStoreSharedOptions<C>>

    public constructor (
        async: IsAsync,
        binding?: CacheStoreBinding<IsAsync, Value>,
        options?: CacheStoreSharedOptions<C>,
    ) {
        this.async = async
        this.binding = binding ?? new CacheStoreBindingMemory<IsAsync, Value>()
        this.promise = new PromiseManager(async)

        this.options = {
            patchUnknownItem: options?.patchUnknownItem ?? false,
            convert: options?.convert ?? <CacheStoreConvertOptions<C>>{
                fromKey: (key) => <C><unknown>({ key }),
                toKey: (...input) => input[0],
                toKeyFromObject: (input) => input['key'],
            },
        }
    }

    public deleteAll (): IfAsync<IsAsync, void> {
        if (!this.binding.deleteAll) return void 0 as IfAsync<IsAsync, void>
        else return this.binding.deleteAll()
    }

    public delete(...args: ObjValueTuple<C>): IfAsync<IsAsync, void> {
        return this.binding.delete(this.options.convert.toKey(...args))
    }

    public put(...args: [...ObjValueTuple<C>, value: Value]): IfAsync<IsAsync, void> {
        const { last, values } = getLastTupleValue(args)
        const key = this.options.convert.toKey(...values)

        return this.binding.put(key, last)
    }

    public get(...args: ObjValueTuple<C>): IfAsync<IsAsync, Value | undefined> {
        return this.binding.get(this.options.convert.toKey(...args))
    }

    public edit(...args: [...ObjValueTuple<C>, value: Partial<Value> | ((item: Value | undefined) => Value)]) {
        const { last: value, values } = getLastTupleValue(args)

        return this.promise.consume(this.get(...values), (item) => {
            if (item == undefined && !this.options.patchUnknownItem) return undefined
            const merged = typeof value === 'function'
                ? value(item)
                : typeof item === 'object'
                    ? { ...(item ?? {}), ...value } as Value
                    : value as Value // seems to be typed correctly

            return this.promise.chain(this.put(...[...values, merged]), () => {
                return merged
            })
        })
    }

    public bulkPut(items: (C & { value: Value })[]): IfAsync<IsAsync, void> {
        if (items.length === 0) {
            return undefined as IfAsync<IsAsync, void>
        }

        const converted = items.map(item => ({
            key: this.options.convert.toKeyFromObject(item),
            value: item.value,
        }))
        if (this.binding.bulkPut != undefined) {
            return this.binding.bulkPut(converted)
        }

        return this.promise.consume(this.promise.all(converted.map(({ key, value }) => {
            return this.binding.put(key, value)
        })), () => {})
    }

    public bulkGet(keys: C[]): IfAsync<IsAsync, ({ key: string, value: Value } | undefined)[]> {
        if (keys.length === 0) {
            return [] as IfAsync<IsAsync, never[]>
        }

        const converted = keys.map(item => {
            return this.options.convert.toKeyFromObject(item)
        })
        if (this.binding.bulkGet != undefined) {
            return this.binding.bulkGet(converted)
        }

        return this.promise.consume(this.promise.all(converted.map(key => {
            return this.promise.consume(this.binding.get(key), value => {
                return value ? { value, key } : undefined
            })
        })), result => result)
    }

    public bulkDelete(keys: C[]): IfAsync<IsAsync, void> {
        if (keys.length === 0) {
            return undefined as IfAsync<IsAsync, void>
        }

        const converted = keys.map(key => this.options.convert.toKeyFromObject(key))
        if (this.binding.bulkDelete != undefined) {
            return this.binding.bulkDelete(converted)
        }

        return this.promise.consume(this.promise.all(converted.map(key => {
            return this.binding.delete(key)
        })), () => {})
    }

    public static createSync<Value, Store extends typeof CacheStoreShared<false, Value>>(
        store: Store,
        binding?: CacheStoreBinding<false, Value>,
        options?: Partial<typeof store['prototype']['options']>,
    ) {
        return new store(false, binding, options) as unknown as InstanceType<Store>
    }

    public static createAsync<Value, Store extends typeof CacheStoreShared<true, Value>>(
        store: Store,
        binding?: CacheStoreBinding<true, Value>,
        options?: Partial<typeof store['prototype']['options']>,
    ) {
        return new store(true, binding, options) as unknown as InstanceType<Store>
    }
}
