import {
    PatreonClientMethods,
    type GetResponseMap,
    type Oauth2FetchOptions,
    type Oauth2RouteOptions,
} from './baseMethods'

import {
    type CreatorToken,
    type PatreonOauthClientOptions,
    type StoredToken,
    type Token,
} from '../oauth2/client'

import {
    type PatreonTokenFetchOptions,
    type RESTOptions,
} from '../oauth2'
import { WebhookClient } from '../webhooks'

export type {
    GetResponseMap,
    Oauth2FetchOptions,
    Oauth2RouteOptions,
    CreatorToken,
    StoredToken,
    Token,
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

    /**
     * The rest options for this client
     */
    rest?: Partial<RESTOptions>

    /**
     * Options for storing and getting API (creator) tokens.
     * @default undefined
     */
    store?: PatreonTokenFetchOptions
}

export abstract class PatreonClient extends PatreonClientMethods {
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

    public constructor(options: PatreonClientOptions, type: 'oauth' | 'creator') {
        options.oauth.tokenType ??= type

        super(options.oauth, options.rest)
        this.webhooks = new WebhookClient(this.oauth)

        this.name = options.name ?? null
        this.store = options.store

        this.oauth.onTokenRefreshed = async (token) => {
            if (token) await this.putStoredToken?.(token, true)
        }

        this.oauth['rest'].options.getAccessToken ??= async () => {
            return await this.fetchStoredToken()
                .then(token => token?.access_token)
        }
    }

    protected static async fetchStored(store?: PatreonTokenFetchOptions): Promise<StoredToken | undefined> {
        const stored = await store?.get()
        if (stored == undefined) return undefined

        const { expires_in_epoch } = stored
        stored.expires_in = (Math.round((parseInt(expires_in_epoch) - Date.now()) / 1000)).toString()
        return stored
    }

    /**
     * Fetch the stored token with the `get` method from the client options
     * @returns the stored token, if `options.store.get` is defined and returns succesfully.
     */
    public async fetchStoredToken(): Promise<StoredToken | undefined> {
        return PatreonClient.fetchStored(this.store)
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
