import {
    type Oauth2StoredToken,
} from './client'
import {
    type RestFetcher,
} from './rest'

import type { If } from '../../../utils/generics'

export interface PatreonFetchOptions<Value, Options, IsAsync extends boolean = true, ListOptions = Options, ListValue = Value> {
    /**
     * Store the value from the client to an external resource
     * @param value The value to store
     * @param options
     */
    put: (value: Value, options?: Options) => If<IsAsync, Promise<void>, void>

    /**
     * Method to retreive the stored value.
     */
    get: (options?: Options) => If<IsAsync, Promise<Value | undefined>, Value | undefined>

    delete: (options?: Options) => If<IsAsync, Promise<void>, void>
    list: (options: ListOptions) => If<IsAsync, Promise<ListValue[]>, ListValue[]>
}

export type PatreonTokenFetchOptions<IsAsync extends boolean = true> = PatreonFetchOptions<
    Oauth2StoredToken,
    { isCreatorToken?: boolean, key?: string },
    IsAsync
>

class PatreonFetchStore<Value, Options> implements PatreonFetchOptions<Value, Options, true> {
    public get: (options?: Options) => Promise<Value | undefined>
    public put: (value: Value, options?: Options) => Promise<void>
    public delete: (options?: Options | undefined) => Promise<void>

    // TODO:
    /**
     * WARNING: The list API will probably be different from the default KV,
     * so this functionality is not implemented yet!
     * @param _options The options for listing values
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public list: (options: Options) => Promise<Value[]> = (_options) => {
        throw new Error('This method has not been implemented')
    }

    /**
     * Sync tokens in a remote server
     * @param url The server URL that accepts DELETE, GET and PUT requests
     * @param [fetchFn] The fetch function to use. Defaults to the globally available `fetch` function.
     */
    public constructor (url: string | ((options?: Options) => string), fetchFn?: RestFetcher) {
        const _fetch = fetchFn ?? fetch

        this.get = async (options) => _fetch(typeof url === 'string' ? url : url(options), { method: 'GET' })
            .then(res => res.ok ? res.json() as never : undefined)

        this.put = async (token, options) => {
            await _fetch(typeof url === 'string' ? url : url(options), {
                method: 'PUT',
                body: JSON.stringify(token),
            })
        }

        this.delete = async (options) => {
            await _fetch(typeof url === 'string' ? url : url(options), { method: 'DELETE' })
        }
    }
}

export interface PatreonStoreKVStorage {
    get: (key: string) => Promise<string | null>
    put: (key: string, value: string) => Promise<void>
    delete: (key: string) => Promise<void>
    list: (options: object) => Promise<never[]>
}

/** @deprecated */
export type KVLikeStore = PatreonStoreKVStorage

/**
 * A store for Patreon tokens stored in a KV-like resource.
 */
class PatreonKVStore<Value, Options extends object> implements PatreonFetchOptions<Value, Options, true> {
    public get: (options?: Options) => Promise<Value | undefined>
    public put: (value: Value, options?: Options) => Promise<void>
    public delete: (options?: Options | undefined) => Promise<void>
    public list: (options: Options) => Promise<Value[]>

    /**
     * Sync values in a KV-like store
     * @param store the external KV-like store to use for synchronizing values
     * @param getKey the key in the store to save the value in
     */
    public constructor (store: PatreonStoreKVStorage, getKey: (options?: Options) => string) {
        this.get = async (options) => await store.get(getKey(options))
            .then(value => value ? JSON.parse(value) : undefined)
            .catch(() => undefined)

        this.put = async (token, options) => await store.put(getKey(options), JSON.stringify(token))
        this.delete = async (options) => await store.delete(getKey(options))
        this.list = async (options) => await store.list(options)
    }
}

class PatreonMemoryStore<Value, Options, ListOptions = Options, ListValue = Value> implements
    PatreonFetchOptions<Value, Options, false, ListOptions, ListValue> {
    public values: Map<string, Value>

    public getKey: (options?: Options) => string
    protected filter: (key: string, value: Value, options: ListOptions) => boolean
    protected toListValue: (key: string, value: Value, options: ListOptions) => ListValue

    public constructor (options: {
        getKey: (options?: Options) => string
        filter: (key: string, value: Value, options: ListOptions) => boolean
        toListValue: (key: string, value: Value, options: ListOptions) => ListValue
    }) {
        this.getKey = options.getKey
        this.filter = options.filter
        this.toListValue = options.toListValue

        this.values = new Map()
    }

    public list (options: ListOptions): ListValue[] {
        return this.values.entries()
            .filter(([key, value]) => this.filter(key, value, options))
            .map(n => this.toListValue(n[0], n[1], options))
            .toArray()
    }

    public put (value: Value, options?: Options): void {
        this.values.set(this.getKey(options), value)
    }

    public get (options?: Options): Value | undefined {
        return this.values.get(this.getKey(options))
    }

    public delete (options?: Options | undefined): void {
        this.values.delete(this.getKey(options))
    }
}

class PatreonFetchTokenStore extends PatreonFetchStore<
    Oauth2StoredToken,
    { isCreatorToken?: boolean, key?: string, url?: string } | string
> {
    public constructor (url: string | ((options?: { isCreatorToken?: boolean, key?: string, url?: string }) => string), fetchFn?: RestFetcher) {
        super(
            (options) => {
                return options != undefined
                    ? (typeof options === 'string' ? options : (options.url ?? (typeof url === 'string' ? url : url(options))))
                    : (typeof url === 'string' ? url : url(options))
            },
            fetchFn,
        )
    }
}

/**
 * A store for Patreon tokens stored in a KV-like resource.
 */
class PatreonKVTokenStore extends PatreonKVStore<Oauth2StoredToken, { isCreatorToken?: boolean, key?: string }> {
    public creatorKey: string = 'creator'

    /**
     * Sync tokens in a KV-like store
     * @param store the external KV-like store to use for synchronizing tokens
     * @param tokenKey the key in the store to save the token in
     */
    public constructor (store: PatreonStoreKVStorage, tokenKey: string) {
        super(store, (options) => options?.key ?? (options?.isCreatorToken ? this.creatorKey : tokenKey))
    }
}

class PatreonMemoryTokenStore extends PatreonMemoryStore<Oauth2StoredToken, { isCreatorToken?: boolean, key?: string }> {
    public creatorKey: string = 'creator'

    public constructor (tokenKey: string) {
        super({
            getKey: (options) => options?.key ?? (options?.isCreatorToken ? this.creatorKey : tokenKey),
            filter: (key, _value, options) => key === options?.key,
            toListValue: (_key, value) => value,
        })
    }
}

export const PatreonStore = {
    Fetch: PatreonFetchTokenStore,
    KV: PatreonKVTokenStore,
    Memory: PatreonMemoryTokenStore,
}

export const PatreonCacheStore = {
    Fetch: PatreonFetchStore,
    KV: PatreonKVStore,
    Memory: PatreonMemoryStore,
}
