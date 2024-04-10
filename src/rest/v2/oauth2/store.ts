import {
    type StoredToken,
} from './client'

declare class Response {
    ok: boolean
    status: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    json: () => Promise<any>
}

export type Fetch = (url: string, options?: {
    method?: string,
    headers?: Record<string, string>,
    body?: string
}) => Promise<Response>

export interface PatreonTokenFetchOptions {
    put: (token: StoredToken, url?: string) => Promise<void>
    get: () => Promise<StoredToken | undefined>
}

class PatreonFetchStore implements PatreonTokenFetchOptions {
    public get: () => Promise<StoredToken | undefined>
    public put: (token: StoredToken, url?: string | undefined) => Promise<void>

    /**
     * Sync tokens
     * @param url The server URL that accepts GET and PUT requests
     * @param fetchFn The fetch function to use
     */
    public constructor (url: string, fetchFn?: Fetch) {
        const _fetch = fetchFn ?? fetch

        this.get = async () => _fetch(url, { method: 'GET' })
            .then(res => res.ok ? res.json() : undefined)

        this.put = async (token, _url) => {
            await fetch(_url ?? url, {
                method: 'PUT',
                body: JSON.stringify(token),
            })
        }
    }
}

class PatreonKVStore implements PatreonTokenFetchOptions {
    public get: () => Promise<StoredToken | undefined>
    public put: (token: StoredToken) => Promise<void>

    public constructor (store: {
        get: (key: string) => Promise<string | null>
        put: (key: string, value: string) => Promise<void>
    }, tokenKey: string) {
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
