import type {
    CacheStoreBinding,
    CacheStoreBindingOptions
} from '../base'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export default class<Value, Metadata extends {} = {}> implements CacheStoreBinding<false, Value> {
    protected cache: Map<string, Value> = new Map()

    public constructor (
        public options: CacheStoreBindingOptions = {},
    ) {}

    public get (key: string): Value | undefined {
        return this.cache.get(key)
    }

    public delete(key: string): void {
        this.cache.delete(key)
    }

    public deleteAll(): void {
        this.cache.clear()
    }

    public put(key: string, value: Value): void {
        this.cache.set(key, value)
    }

    public list(options?: { prefix?: string; }): { keys: { key: string; metadata: Metadata }[] } {
        const iterator = this.cache.keys()
        const keys = (typeof options?.prefix === 'string'
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ? iterator.filter(key => key.startsWith(options.prefix!)) : iterator)
            .toArray()

        return {
            keys: keys.map(key => ({
                key,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                metadata: <Metadata>this.options.convert?.toMetadata?.(this.get(key)!)
                    ?? <Metadata>{}
            }))
        }
    }

    public bulkDelete(keys: string[]): void {
        for (const key of keys) {
            this.cache.delete(key)
        }
    }

    public bulkGet(keys: string[]): ({ id: string, value: Value } | undefined)[] {
        return keys.map(key => {
            const value = this.cache.get(key)
            if (!value) return undefined

            return {
                value,
                id: this.options.convert
                    ? this.options.convert.fromKey(key).id
                    : key,
            }
        })
    }

    public bulkPut(items: { key: string; value: Value }[]): void {
        for (const { key, value } of items) {
            this.cache.set(key, value)
        }
    }
}
