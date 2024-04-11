import ClientOAuth2 from 'client-oauth2'

import type { Oauth2FetchOptions } from '../client'
import type { BasePatreonQuery, GetResponsePayload } from '../query'
import { RouteBases } from '../routes'

import type { Fetch } from './store'

export interface BaseOauthClientOptions {
    clientId: string
    clientSecret: string
}

export interface BaseOauthHandlerOptions {
    redirectUri: string
    scopes?: string[]
    state?: string | undefined
}

export interface Token extends Record<string, string> {
    access_token: string
    refresh_token: string
    expires_in: string
    token_type: string
}

export interface StoredToken extends Token {
    expires_in_epoch: string
}

export class PatreonOauthClient {
    public options: ClientOAuth2.Options
    protected oauth2: ClientOAuth2
    public cachedToken: ClientOAuth2.Token | undefined = undefined
    public refreshOnFailed: boolean

    public onTokenRefreshed?: (token: StoredToken) => Promise<void>

    public constructor(
        options: BaseOauthClientOptions & (BaseOauthHandlerOptions | object),
        refreshOnFailed: boolean,
        token?: Token
    ) {
        this.refreshOnFailed = refreshOnFailed
        this.options = {
            accessTokenUri: 'https://patreon.com/api/oauth2/token',
            authorizationUri: 'https://patreon.com/oauth2/authorize',
            clientId: options.clientId,
            clientSecret: options.clientSecret,
        }

        if ('redirectUri' in options) this.options.redirectUri = options.redirectUri
        if ('state' in options && options.state) this.options.state = options.state
        if ('scopes' in options && options.scopes) this.options.scopes = options.scopes

        this.oauth2 = new ClientOAuth2(this.options)
        if (token) this.cachedToken = this.oauth2.createToken(token)
    }

    protected static async validateToken(
        client: PatreonOauthClient,
        token: ClientOAuth2.Token | undefined = client.cachedToken
    ) {
        if (token != undefined && !token.expired()) return token
        if (token == undefined) throw new Error('No token found to validate!')

        const refreshed = await token.refresh(client.options)
        await client.onTokenRefreshed?.(this.toStored(refreshed))
        client.cachedToken = refreshed

        return refreshed
    }

    public static async fetch<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        clientOptions: {
            refreshOnFailed: boolean
            oauth: PatreonOauthClient
            fetch: Fetch
        },
        options?: Oauth2FetchOptions,
    ): Promise<GetResponsePayload<Query> | undefined> {
        const token = await this.validateToken(
            clientOptions.oauth,
            options?.token
                ? clientOptions.oauth.toRaw(options.token)
                : undefined
        )

        return await clientOptions.fetch(RouteBases.oauth2 + path + query.query, {
            method: options?.method ?? 'GET',
            headers: {
                'Content-Type': options?.contentType ?? 'application/json',
                'Authorization': 'Bearer ' + token.accessToken,
            },
        }).then(res => {
            if (res.ok) return res.json()

            const shouldRefetch = options?.refreshOnFailed !== false && (options?.refreshOnFailed || clientOptions.refreshOnFailed)
            if (shouldRefetch && res.status === 403) {
                return this.fetch(path, query, clientOptions, {
                    ...options,
                    refreshOnFailed: false,
                })
            }
        })
    }

    /** @deprecated */
    public static getTokenData(token: ClientOAuth2.Token): Token {
        return <Token>token.data
    }

    /** @deprecated */
    public static getExpiresEpoch(token: ClientOAuth2.Token): { expires_in_epoch: string } {
        return {
            expires_in_epoch: token
                .expiresIn(parseInt(token.data.expires_in))
                .getTime()
                .toString(),
        }
    }

    /** @deprecated */
    public static toStored(token: ClientOAuth2.Token): StoredToken {
        return {
            ...this.getTokenData(token),
            ...this.getExpiresEpoch(token),
        }
    }

    public async _fetchToken(requestUrl: string, type: 'code' | 'credentials', cache = true) {
        const fetch = () => type === 'code'
            ? this.oauth2.code.getToken(new URL(requestUrl))
            : this.oauth2.credentials.getToken()

        const token = await fetch()

        if (cache) this.cachedToken = token
        return token
    }

    protected getStoredData (token: Token): StoredToken {
        const raw = this.toRaw(token)
        return PatreonOauthClient.toStored(raw)
    }

    public toRaw (token: Token): ClientOAuth2.Token {
        return this.oauth2.createToken(token)
    }

    /**
     * @deprecated
     * @param requestUrl The incoming request URL with the code parameter
     * @example
     * ```ts
     * async fetch(request) {
     *  const token = await client.fetchToken(request.url)
     * }
     * ```
     */
    public async fetchToken(requestUrl: string) {
        return await this._fetchToken(requestUrl, 'code', false)
            .then(PatreonOauthClient.getTokenData)
    }

    /**
     * @deprecated
     * @returns if the token is updated and stored, and the token
     */
    public async fetchApplicationToken() {
        return await this._fetchToken('', 'credentials', true)
            .then(raw => ({ success: raw != undefined, token: PatreonOauthClient.toStored(raw) }))
    }
}