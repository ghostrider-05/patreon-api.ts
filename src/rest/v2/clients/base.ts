import { BasePatreonClientMethods } from './baseMethods'

import {
    PatreonOauthClient,
    type Token,
    type StoredToken,
    type PatreonOauthClientOptions,
} from '../oauth2/client'

import { type PatreonTokenFetchOptions } from '../oauth2/store'

export type {
    Token,
    StoredToken,
}

export type PatreonClientOptions = {
    oauth: PatreonOauthClientOptions
    name?: string
    store?: PatreonTokenFetchOptions
}

export type PatreonInitializeClientOptions = PatreonClientOptions & Required<Pick<PatreonClientOptions, 'store'>>

export interface Oauth2FetchOptions {
    retryOnFailed?: boolean
    /** @deprecated */
    refreshOnFailed?: boolean
    token?: StoredToken
    method?: string
    body?: string
    contentType?: string
}

export type Oauth2RouteOptions = Omit<Oauth2FetchOptions, 'method'>

export abstract class BasePatreonClient extends BasePatreonClientMethods {
    private store: PatreonTokenFetchOptions | undefined = undefined

    /**
     * The application name.
     * Can be useful to log or something.
     */
    public name: string | null = null

    public constructor(patreonOptions: PatreonClientOptions) {
        super(new PatreonOauthClient(patreonOptions.oauth))

        this.name = patreonOptions.name ?? null
        this.store = patreonOptions.store
        this.oauth.onTokenRefreshed = async (token) => {
            if (token) await this.putStoredToken?.(token, true)
        }
    }

    /** @deprecated */
    public static async initialize(options: PatreonInitializeClientOptions) {
        const token = await this.fetchStored(options.store)
        if (token) options.oauth.token ??= token

        return new PatreonClient(options)
    }

    protected static async fetchStored(store?: PatreonTokenFetchOptions) {
        const stored = await store?.get()
        if (stored == undefined) return undefined

        const { expires_in_epoch } = stored
        stored.expires_in = ((parseInt(expires_in_epoch) - Date.now()) / 1000).toString()
        return stored
    }

    /**
     * Fetch the stored token with the `get` method from the client options
     */
    public async fetchStoredToken() {
        return BasePatreonClient.fetchStored(this.store)
    }

    /**
     * Save your token with the method from the client options
     * @param token The token to save
     * @param cache Whether to overwrite the application token cache and update it with the token
     */
    public async putStoredToken(token: StoredToken, cache?: boolean) {
        await this.store?.put(token)
        if (cache) this.oauth.cachedToken = token
    }
}

/** @deprecated */
export class PatreonClient extends BasePatreonClient {}
