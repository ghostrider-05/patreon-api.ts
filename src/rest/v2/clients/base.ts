import ClientOAuth2 from 'client-oauth2'

import { BasePatreonClientMethods } from './baseMethods'

import {
    PatreonOauthClient,
    type Token,
    type StoredToken,
    type BaseOauthClientOptions,
    BaseOauthHandlerOptions,
} from '../oauth2/client'

import { type Fetch, type PatreonTokenFetchOptions } from '../oauth2/store'

export type {
    Token,
    StoredToken,
}

export interface PatreonClientOptions extends BaseOauthClientOptions {
    name?: string
    store?: PatreonTokenFetchOptions
    refreshOnFailed?: boolean
    fetch?: Fetch
    token?: Token
}

export type PatreonInitializeClientOptions = PatreonClientOptions & Required<Pick<PatreonClientOptions, 'store'>>

export interface Oauth2FetchOptions {
    refreshOnFailed?: boolean
    token?: StoredToken
    method?: string
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

    public constructor(
        patreonOptions: PatreonClientOptions & (BaseOauthHandlerOptions | object),
    ) {
        super(
            new PatreonOauthClient(patreonOptions,
                patreonOptions.refreshOnFailed ?? false,
                patreonOptions.token
            ),
            patreonOptions.fetch ?? fetch
        )

        this.name = patreonOptions.name ?? null
        this.store = patreonOptions.store
        this.oauthClient.onTokenRefreshed = async (token) => {
            await this.store?.put?.(token)
        }
    }

    /** @deprecated */
    public static async initialize(options: PatreonInitializeClientOptions) {
        const token = await this.fetchStored(options.store)
        if (token) options.token ??= token

        return new PatreonClient(options)
    }

    /** @deprecated */
    protected static toStored = PatreonOauthClient.toStored

    protected static async fetchStored(store?: PatreonTokenFetchOptions) {
        const stored = await store?.get()
        if (stored == undefined) return undefined

        const { expires_in_epoch } = stored
        stored.expires_in = ((parseInt(expires_in_epoch) - Date.now()) / 1000).toString()
        return stored
    }

    /**
     * For handling Oauth2 requests, fetch the token that is assiocated with the request code
     * @param requestUrl The url with the `code` parameter
     * @deprecated
     */
    public async fetchToken(requestUrl: string): Promise<StoredToken> {
        const token = await this.oauthClient._fetchToken(requestUrl, 'code', false)
        if (token) await this.store?.put(BasePatreonClient.toStored(token), requestUrl)

        return BasePatreonClient.toStored(token)
    }

    protected async validateToken(token: ClientOAuth2.Token | undefined = this.oauthClient.cachedToken) {
        if (token != undefined && !token.expired()) return token
        if (token == undefined) throw new Error('No token found to validate!')

        const refreshed = await token.refresh(this.oauthClient.options)
        await this.store?.put(BasePatreonClient.toStored(refreshed))
        this.oauthClient.cachedToken = refreshed

        return refreshed
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
        if (cache) this.oauthClient.cachedToken = this.oauthClient.toRaw(token)
    }


    /**
     * Save your token with the method from the client options
     * @deprecated Use {@link putStoredToken}
     * @param token The token to save
     * @param cache Whether to overwrite the application token cache and update it with the token
     */
    public async putToken(token: StoredToken, cache?: boolean) {
        return this.putStoredToken(token, cache)
    }

    /**
     * @deprecated
     * @returns if the token is updated and stored, and the token
     */
    public async fetchApplicationToken() {
        return await this.oauthClient._fetchToken('', 'credentials', true)
            .then(raw => ({ success: raw != undefined, token: BasePatreonClient.toStored(raw) }))
    }
}

/** @deprecated */
export class PatreonClient extends BasePatreonClient {}
