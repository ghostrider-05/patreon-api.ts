import type {
    CacheStoreBinding,
    CacheStoreBindingOptions
} from '../base'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export default class<Value, Metadata extends {} = {}> implements CacheStoreBinding<false, Value> {
    protected cache: Map<string, Value> = new Map()

    public constructor (
        public options: CacheStoreBindingOptions,
        protected toMetadata: (value: Value) => Metadata = () => (<Metadata>{}),
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

    public list(options: { prefix: string; }): { keys: { key: string; metadata: Metadata }[] } {
        const keys = this.cache.keys()
            .filter(key => key.startsWith(options.prefix))
            .toArray()

        return {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            keys: keys.map(key => ({ key, metadata: this.toMetadata(this.get(key)!) }))
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
                id: this.options.convert.fromKey(key).id,
            }
        })
    }

    public bulkPut(items: { key: string; value: Value }[]): void {
        for (const { key, value } of items) {
            this.cache.set(key, value)
        }
    }
}
