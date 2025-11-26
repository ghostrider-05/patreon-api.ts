import { ObjValueTuple } from '../../../utils/fields'
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
            Relationship<T, RelationshipFields<T>>['relationships'][R]['data'] extends infer K
                ? NonNullable<K> extends unknown[]
                    ? string[]
                    : string
                : never
        ) | null
    }
}

export interface CacheStoreConvertOptions<
    O extends Record<string, unknown> = Record<string, unknown>
> {
    toKey (...args: ObjValueTuple<O>): string
    fromKey (key: string): O
    toKeyFromObject (key: O): string
}

export interface CacheStoreBinding<IsAsync extends boolean, Value> {
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

    list?(options?: {
        prefix?: string
        getMetadata?: (item: Value) => object
    }): IfAsync<IsAsync, { keys: { key: string; metadata: object }[] }>

    bulkPut?(items: {
        key: string
        value: Value
    }[]): IfAsync<IsAsync, void>
    bulkGet?(keys: string[]): IfAsync<IsAsync, ({ key: string, value: Value } | undefined)[]>
    bulkDelete?(keys: string[]): IfAsync<IsAsync, void>

    deleteAll?(): IfAsync<IsAsync, void>
}
