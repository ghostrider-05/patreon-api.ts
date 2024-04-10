import ClientOAuth2 from 'client-oauth2'

import { BasePatreonQuery, GetResponsePayload } from '../query'
import { RouteBases } from '../routes'

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

export class PatreonClient extends PatreonOauthClient {
    private store: PatreonTokenFetchOptions | undefined = undefined
    private refreshOnFailed: boolean
    private _fetch: Fetch

    /**
     * The application name.
     * Can be useful to log or something.
     */
    public name: string | null = null

    public constructor(
        patreonOptions: PatreonClientOptions & (BaseOauthHandlerOptions | object),
    ) {
        super(patreonOptions, patreonOptions.token)
        this._fetch = patreonOptions.fetch ?? fetch

        this.name = patreonOptions.name ?? null
        this.store = patreonOptions.store
        this.refreshOnFailed = patreonOptions.refreshOnFailed ?? false
    }

    public static async initialize(options: PatreonInitializeClientOptions) {
        const token = await this.fetchStored(options.store)
        if (token) options.token ??= token

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
        return PatreonClient.fetchStored(this.store)
    }

    /**
     * For handling Oauth2 requests, fetch the token that is assiocated with the request code
     * @param requestUrl The url with the `code` parameter
     * @deprecated
     */
    public override async fetchToken(requestUrl: string): Promise<StoredToken> {
        const token = await this._fetchToken(requestUrl, 'code', false)
        if (token) await this.store?.put(PatreonClient.toStored(token), requestUrl)

        return PatreonClient.toStored(token)
    }

    protected async validateToken(token: ClientOAuth2.Token | undefined = this.cachedToken) {
        if (token != undefined && !token.expired()) return token
        if (token == undefined) throw new Error('No token found to validate!')

        const refreshed = await token.refresh(this.options)
        await this.store?.put(PatreonClient.toStored(refreshed))
        this.cachedToken = refreshed

        return refreshed
    }

    /**
     * Save your token with the method from the client options
     * @param token The token to save
     * @param cache Whether to overwrite the application token cache and update it with the token
     */
    public async putToken(token: StoredToken, cache?: boolean) {
        await this.store?.put(token)
        if (cache) this.cachedToken = this.toRaw(token)
    }

    /**
     * Fetch the Patreon Oauth V2 API
     * @param path The Oauth V2 API Route
     * @param query The query builder with included fields and attributes
     * @param options Request options
     */
    public async fetchOauth2<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions,
    ): Promise<GetResponsePayload<Query> | undefined> {
        const token = await this.validateToken(options?.token
            ? this.toRaw(options.token)
            : undefined
        )

        return await this._fetch(RouteBases.oauth2 + path + query.query, {
            method: options?.method ?? 'GET',
            headers: {
                'Content-Type': options?.contentType ?? 'application/json',
                'Authorization': 'Bearer ' + token.accessToken,
            },
        }).then(res => {
            if (res.ok) return res.json()

            const shouldRefetch = options?.refreshOnFailed !== false && (options?.refreshOnFailed || this.refreshOnFailed)
            if (shouldRefetch && res.status === 403) {
                return this.fetchOauth2(path, query, {
                    ...options,
                    refreshOnFailed: false,
                })
            }
        })
    }
}