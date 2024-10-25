import {
    type StoredToken,
} from './client'
import {
    type RestFetcher,
} from './rest'

export interface PatreonTokenFetchOptions {
    /**
     * Store the token from the client to an external resource
     * @param token The token to store
     * @param [url] For the Fetch store, send the request to a different url than the default url.
     */
    put: (token: StoredToken, url?: string) => Promise<void>

    /**
     * Method to retreive the stored token
     */
    get: () => Promise<StoredToken | undefined>
}

class PatreonFetchStore implements PatreonTokenFetchOptions {
    public get: () => Promise<StoredToken | undefined>
    public put: (token: StoredToken, url?: string | undefined) => Promise<void>

    /**
     * Sync tokens in a remote server
     * @param url The server URL that accepts GET and PUT requests
     * @param [fetchFn] The fetch function to use. Defaults to the globally available `fetch` function.
     */
    public constructor (url: string, fetchFn?: RestFetcher) {
        const _fetch = fetchFn ?? fetch

        this.get = async () => _fetch(url, { method: 'GET' })
            .then(res => res.ok ? res.json() as never : undefined)

        this.put = async (token, _url) => {
            await _fetch(_url ?? url, {
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
class PatreonKVStore implements PatreonTokenFetchOptions {
    public get: () => Promise<StoredToken | undefined>
    public put: (token: StoredToken) => Promise<void>

    /**
     * Sync tokens in a KV-like store
     * @param store the external KV-like store to use for synchronizing tokens
     * @param tokenKey the key in the store to save the token in
     */
    public constructor (store: PatreonStoreKVStorage, tokenKey: string) {
        this.get = async () => await store.get(tokenKey)
            .then(value => value ? JSON.parse(value) : undefined)
            .catch(() => undefined)

        this.put = async (token) => await store.put(tokenKey, JSON.stringify(token))
    }
}

export const PatreonStore = {
    Fetch: PatreonFetchStore,
    KV: PatreonKVStore,
}
