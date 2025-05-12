import { type ItemMap, type ItemType } from '../item'

import type {
    Relationship,
    RelationshipFields,
} from '../relationships'

import type { IfAsync } from './promise'

export type CacheItem<T extends ItemType> = {
    item: Partial<ItemMap[T]>
    relationships: {
        [R in keyof Relationship<T, RelationshipFields<T>>['relationships']]: (
            Relationship<T, RelationshipFields<T>>['relationships'] extends unknown[]
                ? string[]
                : string
        ) | null
    }
}

export interface CacheSearchOptions {
    id: string | null
    type: ItemType
}

export interface CacheStoreSearchConvertOptions {
    toKey (options: CacheSearchOptions & { id: string }): string
    fromKey (key: string): CacheSearchOptions & { id: string }
}

export interface CacheStore<IsAsync extends boolean> {
    delete (type: ItemType, id: string): IfAsync<IsAsync, void>
    put <T extends ItemType>(type: T, id: string, value: CacheItem<T>): IfAsync<IsAsync, void>
    edit <T extends ItemType>(type: T, id: string, value: Partial<ItemMap[T]>): IfAsync<IsAsync, ItemMap[T] | undefined>
    get <T extends ItemType> (type: T, id: string): IfAsync<IsAsync, CacheItem<T> | undefined>

    bulkPut<T extends ItemType>(items: {
        type: T
        id: string
        value: CacheItem<T>
    }[]): IfAsync<IsAsync, void>
    bulkGet<T extends ItemType> (items: {
        type: T
        id: string
    }[]): IfAsync<IsAsync, (CacheItem<T> | undefined)[]>
    bulkDelete(items?: {
        type: ItemType
        id: string
    }[]): IfAsync<IsAsync, void>
}

export interface CacheStoreBinding<IsAsync extends boolean> {
    /**
     * Store the value from the client to an external resource
     * @param key The key that has information about the item type and id
     * @param value The value to store
     */
    put(key: string, value: CacheItem<ItemType>): IfAsync<IsAsync, void>

    /**
     * Method to retreive the stored value.
     * @param key The key that has information about the item type and id
     */
    get(key: string): IfAsync<IsAsync, CacheItem<ItemType> | undefined>
    delete(key: string): IfAsync<IsAsync, void>
    list(options: {
        type: ItemType
        relationships: CacheSearchOptions[]
    }[]): IfAsync<IsAsync, { id: string, value: CacheItem<ItemType> }[]>

    bulkPut?(items: {
        key: string
        value: CacheItem<ItemType>
    }[]): IfAsync<IsAsync, void>
    bulkGet?(keys: string[]): IfAsync<IsAsync, (CacheItem<ItemType> | undefined)[]>
    bulkDelete?(keys: string[]): IfAsync<IsAsync, void>

    deleteAll?(): IfAsync<IsAsync, void>
}

export interface CacheStoreBindingOptions {
    convert: CacheStoreSearchConvertOptions
}
