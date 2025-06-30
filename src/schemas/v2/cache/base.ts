import type { ObjValueTuple } from '../../../utils/fields'
import { type ItemMap, type ItemType } from '../item'

import type {
    Relationship,
    RelationshipFields,
} from '../relationships'

import type { IfAsync } from './promise'

export type CacheItem<T extends ItemType> = {
    item: Partial<ItemMap[T]>
    relationships: {
        [R in keyof Relationship<T, RelationshipFields<T>>['relationships']]?: (
            Relationship<T, RelationshipFields<T>>['relationships'] extends unknown[]
                ? string[]
                : string
        ) | null
    }
}

export interface CacheStoreConvertOptions<
    O extends Record<string, unknown> = Record<string, unknown>
> {
    toKey (options: O & { id: string }): string
    fromKey (key: string): O & { id: string }
    toMetadata? (value: object): object
}

export interface CacheStore<IsAsync extends boolean, Key extends object> {
    delete (...args: ObjValueTuple<Key>): IfAsync<IsAsync, void>
    put <T extends ItemType>(...args: [...ObjValueTuple<Key>, value: CacheItem<T>]): IfAsync<IsAsync, void>

    edit <T extends ItemType>(...args: [...ObjValueTuple<Key>, value: Partial<ItemMap[T]>]): IfAsync<IsAsync, ItemMap[T] | undefined>
    get <T extends ItemType> (...args: ObjValueTuple<Key>): IfAsync<IsAsync, CacheItem<T> | undefined>

    bulkPut<T extends ItemType>(items: {
        type: T
        id: string
        value: CacheItem<T>
    }[]): IfAsync<IsAsync, void>
    bulkGet<T extends ItemType> (items: {
        type: T
        id: string
    }[]): IfAsync<IsAsync, ((Key & { value: CacheItem<T> }) | undefined)[]>
    bulkDelete(items?: Key[]): IfAsync<IsAsync, void>
}

export interface CacheStoreBindingOptions {
    convert?: CacheStoreConvertOptions
}

export interface CacheStoreBinding<IsAsync extends boolean, Value> {
    options: CacheStoreBindingOptions

    /**
     * Store the value from the client to an external resource
     * @param key The key that has information about the item type and id
     * @param value The value to store
     */
    put(key: string, value: Value): IfAsync<IsAsync, void>

    /**
     * Method to retreive the stored value.
     * @param key The key that has information about the item type and id
     */
    get(key: string): IfAsync<IsAsync, Value | undefined>
    delete(key: string): IfAsync<IsAsync, void>
    list(options: {
        prefix: string
    }): IfAsync<IsAsync, { keys: { key: string; metadata: object }[] }>

    bulkPut?(items: {
        key: string
        value: Value
    }[]): IfAsync<IsAsync, void>
    bulkGet?(keys: string[]): IfAsync<IsAsync, ({ id: string, value: Value } | undefined)[]>
    bulkDelete?(keys: string[]): IfAsync<IsAsync, void>

    deleteAll?(): IfAsync<IsAsync, void>
}
