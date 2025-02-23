import {
    type Oauth2StoredToken,
} from './client'
import {
    type RestFetcher,
} from './rest'

import type { If } from '../../../utils/generics'

export interface PatreonFetchOptions<Value, Options, IsAsync extends boolean = true> {
    /**
     * Store the token from the client to an external resource
     * @param token The token to store
     * @param isCreatorToken Whether the token should be saved as the new creator token
     */
    put: (value: Value, options?: Options) => If<IsAsync, Promise<void>, void>

    /**
     * Method to retreive the stored token.
     */
    get: (options?: Options) => If<IsAsync, Promise<Value | undefined>, Value | undefined>
}

export type PatreonTokenFetchOptions<IsAsync extends boolean = true> = PatreonFetchOptions<
    Oauth2StoredToken,
    { isCreatorToken?: boolean, key?: string },
    IsAsync
>

class PatreonFetchStore<Value, Options> implements PatreonFetchOptions<Value, Options, true> {
    public get: (options?: Options) => Promise<Value | undefined>
    public put: (value: Value, options?: Options) => Promise<void>

    /**
     * Sync tokens in a remote server
     * @param url The server URL that accepts GET and PUT requests
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
    }
}

export interface PatreonStoreKVStorage {
    get: (key: string) => Promise<string | null>
    put: (key: string, value: string) => Promise<void>
}

/** @deprecated */
export type KVLikeStore = PatreonStoreKVStorage

/**
 * A store for Patreon tokens stored in a KV-like resource.
 */
class PatreonKVStore<Value, Options extends object> implements PatreonFetchOptions<Value, Options, true> {
    public get: (options?: Options) => Promise<Value | undefined>
    public put: (value: Value, options?: Options) => Promise<void>

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
    }
}

class PatreonMemoryStore<Value, Options> implements PatreonFetchOptions<Value, Options, false> {
    public values: Map<string, Value>

    public getKey: (options?: Options) => string

    public constructor (getKey: (options?: Options) => string) {
        this.getKey = getKey
        this.values = new Map()
    }

    public put (value: Value, options?: Options): void {
        this.values.set(this.getKey(options), value)
    }

    public get (options?: Options): Value | undefined {
        return this.values.get(this.getKey(options))
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
        super((options) => options?.key ?? (options?.isCreatorToken ? this.creatorKey : tokenKey))
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
