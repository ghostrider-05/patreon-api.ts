import type { IfAsync } from '../promise'

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
