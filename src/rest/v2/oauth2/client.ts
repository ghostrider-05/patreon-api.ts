import type { Oauth2FetchOptions } from '../client'
import type { BasePatreonQuery, GetResponsePayload } from '../query'
import { RouteBases } from '../routes'

import type { Fetch } from './store'

export interface BaseOauthClientOptions {
    clientId: string
    clientSecret: string
    token?: Token | StoredToken
    fetch?: Fetch
    retryOnFailed?: boolean
    /** @deprecated use {@link retryOnFailed} */
    refreshOnFailed?: boolean
    accessTokenUri?: string
    authorizationUri?: string
    userAgent?: string
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

type OauthOptions = (Partial<Pick<BaseOauthHandlerOptions, 'redirectUri' | 'scopes' | 'state'>>) & {
    clientId: string
    clientSecret: string
    accessTokenUri: string
    authorizationUri: string
}

export type PatreonOauthClientOptions = BaseOauthClientOptions & (BaseOauthHandlerOptions | Record<string, never>)

export class PatreonOauthClient {
    private clientOptions: PatreonOauthClientOptions
    private readonly defaultUserAgent = 'Patreon-api.ts Bot (https://github.com/ghostrider-05/patreon-api.ts, 0.4.0)'

    public options: OauthOptions
    public cachedToken: StoredToken | undefined = undefined
    public retryOnFailed: boolean

    public onTokenRefreshed?: (token: StoredToken | undefined) => Promise<void> = undefined

    public constructor(options: PatreonOauthClientOptions) {
        this.clientOptions = options
        this.retryOnFailed = options.retryOnFailed ?? options.refreshOnFailed ?? false

        this.options = {
            accessTokenUri: options.accessTokenUri ?? 'https://patreon.com/api/oauth2/token',
            authorizationUri: options.authorizationUri ?? 'https://patreon.com/oauth2/authorize',
            clientId: options.clientId,
            clientSecret: options.clientSecret,
            redirectUri: options.redirectUri,
            scopes: options.scopes ?? [],
            state: options.state,
        }

        if (options.token) this.cachedToken = 'expires_in_epoch' in options.token
            ? <StoredToken>options.token
            : PatreonOauthClient.toStored(options.token)
    }

    public get userAgent () {
        return this.clientOptions.userAgent ?? this.defaultUserAgent
    }

    public get fetch () {
        return this.clientOptions.fetch ?? fetch
    }

    protected static async validateToken(
        client: PatreonOauthClient,
        token: StoredToken | undefined = client.cachedToken
    ) {
        if (token != undefined && !PatreonOauthClient.isExpired(token)) return token
        if (token == undefined) throw new Error('No token found to validate!')

        const refreshed = await client.refreshToken(token)
        await client.onTokenRefreshed?.(refreshed ? this.toStored(refreshed) : undefined)
        if (refreshed) client.cachedToken = refreshed

        return refreshed
    }

    public static async fetch<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        oauthClient: PatreonOauthClient,
        options?: Oauth2FetchOptions,
    ): Promise<GetResponsePayload<Query> | undefined> {
        const token = await this.validateToken(
            oauthClient,
            options?.token
        )

        if (!token) return undefined
        const init = {
            method: options?.method ?? 'GET',
            headers: {
                'Content-Type': options?.contentType ?? 'application/json',
                'Authorization': 'Bearer ' + token.accessToken,
                'User-Agent': oauthClient.userAgent,
            },
        }

        if (options?.body && init.method !== 'GET') init['body'] = options.body

        return await oauthClient.fetch(RouteBases.oauth2 + path + query.query, init).then((res: Response) => {
            if (res.ok) return res.json() as Promise<GetResponsePayload<Query>>

            const shouldRefetch = (options?.retryOnFailed !== false && options?.refreshOnFailed !== false)
                && (options?.retryOnFailed || options?.refreshOnFailed || oauthClient.retryOnFailed)

            if (shouldRefetch && res.status === 403) {
                return this.fetch(path, query, oauthClient, {
                    ...options,
                    refreshOnFailed: false,
                })
            } else return undefined
        })
    }

    public async getOauthTokenFromCode (url: string): Promise<StoredToken | undefined> {
        const code = new URL(url).searchParams.get('code')
        if (!code) return undefined

        const token: Token | undefined = await this.fetch(this.options.accessTokenUri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': this.userAgent,
            },
            body: new URLSearchParams({
                code,
                client_id: this.options.clientId,
                client_secret: this.options.clientSecret,
                grant_type: 'authorization_code',
                redirect_uri: this.options.redirectUri!,
            }).toString(),
        }).then(res => res.ok ? res.json() : undefined)

        return token
            ? PatreonOauthClient.toStored(token)
            : undefined
    }

    public async refreshToken (token: Token | StoredToken | string): Promise<StoredToken | undefined> {
        const refresh_token = typeof token === 'string'
            ? token
            : token.refresh_token

        return await this.fetch(this.options.accessTokenUri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': this.userAgent,
            },
            body: new URLSearchParams({
                refresh_token,
                client_id: this.options.clientId,
                client_secret: this.options.clientSecret,
                grant_type: 'refresh_token',
            }).toString(),
        }).then(res => res.ok ? res.json() : undefined)
    }

    public get oauthUri () {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.options.clientId,
            redirect_uri: this.options.redirectUri!,
        })

        if (this.options.state) params.set('state', this.options.state)
        if (this.options.scopes?.length) params.set('scopes', this.options.scopes.join(','))

        return this.options.authorizationUri + '?' + params.toString()
    }

    public static isExpired (token: StoredToken): boolean {
        return Date.now() > parseInt(token.expires_in_epoch)
    }

    public static toStored(token: Token): StoredToken {
        const now = new Date()
        now.setSeconds(now.getSeconds() + parseInt(token.expires_in))

        return {
            ...token,
            expires_in_epoch: now
                .getTime()
                .toString(),
        }
    }
}
