import type { ItemType } from '../../item'

import type {
    CacheItem,
    CacheSearchOptions,
    CacheStoreBinding,
    CacheStoreBindingOptions
} from '../base'

export default class implements CacheStoreBinding<false> {
    protected cache: Map<string, CacheItem<ItemType>> = new Map()

    public constructor (
        public options: CacheStoreBindingOptions,
    ) {}

    public get (key: string): CacheItem<ItemType> | undefined {
        return this.cache.get(key)
    }

    public delete(key: string): void {
        this.cache.delete(key)
    }

    public deleteAll(): void {
        this.cache.clear()
    }

    public put(key: string, value: CacheItem<ItemType>): void {
        this.cache.set(key, value)
    }

    public list(options: {
        type: ItemType
        relationships: CacheSearchOptions[]
    }[]): { id: string; value: CacheItem<ItemType>; }[] {
        return this.cache.entries().filter(([key, value]) => {
            return options.some(option => {
                const isSameType = this.options.convert.fromKey(key).type === option.type

                return isSameType && option.relationships.every(rel => {
                    const relValue = value.relationships[rel.type]

                    if (typeof rel.id === 'string' && !relValue) return false
                    else if (relValue == null && rel.id == null) return true
                    else return Array.isArray(relValue)
                        ? relValue.includes(rel.id)
                        : relValue === rel.id
                })
            })
        }).map(([key, value]) => ({
            id: this.options.convert.fromKey(key).id,
            value,
        })).toArray()
    }

    public bulkDelete(keys: string[]): void {
        for (const key of keys) {
            this.cache.delete(key)
        }
    }

    public bulkGet(keys: string[]): (CacheItem<ItemType> | undefined)[] {
        return keys.map(key => this.cache.get(key))
    }

    public bulkPut(items: { key: string; value: CacheItem<ItemType>; }[]): void {
        for (const { key, value } of items) {
            this.cache.set(key, value)
        }
    }
}
