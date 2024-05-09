import {
    BasePatreonClientMethods,
    type Oauth2FetchOptions,
    type Oauth2RouteOptions,
} from './baseMethods'

import {
    type Token,
    type StoredToken,
    type PatreonOauthClientOptions,
} from '../oauth2/client'

import { type PatreonTokenFetchOptions } from '../oauth2/store'
import { WebhookClient } from '../webhooks'

export type {
    Oauth2FetchOptions,
    Oauth2RouteOptions,
    Token,
    StoredToken,
}

/**
 * The constructor options for API applications
 */
export type PatreonClientOptions = {
    /**
     * The Oauth options for this client.
     * Required for both creator and user clients.
     */
    oauth: PatreonOauthClientOptions

    /**
     * The application name of this client
     */
    name?: string

    rest?: {
        userAgentAppendix?: string
        retries?: number
    }

    /**
     * Options for storing and getting API (creator) tokens.
     * @default undefined
     */
    store?: PatreonTokenFetchOptions
}

/** @deprecated */
export type PatreonInitializeClientOptions = PatreonClientOptions & Required<Pick<PatreonClientOptions, 'store'>>

export abstract class BasePatreonClient extends BasePatreonClientMethods {
    private store: PatreonTokenFetchOptions | undefined = undefined

    /**
     * The application name of the client.
     * @default null
     */
    public name: string | null = null

    /**
     * Interact with the webhooks API.
     * 
     * Client to use for creating, updating and getting webhooks from the current client.
     */
    public webhooks: WebhookClient

    public constructor(patreonOptions: PatreonClientOptions) {
        super(patreonOptions.oauth, patreonOptions.rest)
        this.webhooks = new WebhookClient(this.oauth)

        this.name = patreonOptions.name ?? null
        this.store = patreonOptions.store
        this.oauth.onTokenRefreshed = async (token) => {
            if (token) await this.putStoredToken?.(token, true)
        }
    }

    /**
     * @param options The client options to initialize the client with.
     * The store option is required.
     * @deprecated
     * @returns a base client.
     */
    public static async initialize(options: PatreonInitializeClientOptions): Promise<PatreonClient> {
        const token = await this.fetchStored(options.store)
        if (token) options.oauth.token ??= token

        return new PatreonClient(options)
    }

    protected static async fetchStored(store?: PatreonTokenFetchOptions): Promise<StoredToken | undefined> {
        const stored = await store?.get()
        if (stored == undefined) return undefined

        const { expires_in_epoch } = stored
        stored.expires_in = ((parseInt(expires_in_epoch) - Date.now()) / 1000).toString()
        return stored
    }

    /**
     * Fetch the stored token with the `get` method from the client options
     * @returns the stored token, if `options.store.get` is defined and returns succesfully.
     */
    public async fetchStoredToken(): Promise<StoredToken | undefined> {
        return BasePatreonClient.fetchStored(this.store)
    }

    /**
     * Save your token with the method from the client options
     * @param token The token to save
     * @param [cache] Whether to overwrite the application token cache and update it with the token
     */
    public async putStoredToken(token: StoredToken, cache?: boolean): Promise<void> {
        await this.store?.put(token)
        if (cache) this.oauth.cachedToken = token
    }
}

/** @deprecated */
export class PatreonClient extends BasePatreonClient {}
