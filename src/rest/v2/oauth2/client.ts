import type { Oauth2FetchOptions } from '../clients'
import { createQuery, type BasePatreonQuery, type GetResponsePayload } from '../query'
import { RouteBases } from '../routes'

import type { Fetch } from './store'

import { VERSION } from '../../../utils'

export interface BaseOauthClientOptions {
    /**
     * The client id of the application.
     * Can be found in the Patreon developer portal.
     */
    clientId: string

    /**
     * The client secret of the application.
     * Can be found in the Patreon developer portal. Keep this private!
     */
    clientSecret: string

    /**
     * Set the (creator) token of the application.
     * If no epoch time (ms) is given, it will assume the token was just created.
     */
    token?: Token | StoredToken

    /**
     * Replace the global fetch function with a custom one.
     */
    fetch?: Fetch

    /**
     * If an request is missing access on, try to refresh the access token and retry the same request.
     * @default false
     */
    retryOnFailed?: boolean

    /**
     * @deprecated use {@link BaseOauthClientOptions.retryOnFailed}
     */
    refreshOnFailed?: boolean

    /**
     * Overwrite the access token Oauth route
     * @default 'https://patreon.com/api/oauth2/token'
     */
    accessTokenUri?: string

    /**
     * Overwrite the authorization Oauth route
     * @default 'https://patreon.com/oauth2/authorize'
     */
    authorizationUri?: string

    /**
     * Overwrites the user agent header of requests.
     * @default - user agent of the library
     */
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

type OauthOptions = Partial<Pick<BaseOauthHandlerOptions, 'redirectUri' | 'scopes' | 'state'>>
    & Required<Pick<BaseOauthClientOptions, 'clientId' | 'clientSecret' | 'accessTokenUri' | 'authorizationUri'>>

/**
 * Client options for handling Oauth
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type PatreonOauthClientOptions = BaseOauthClientOptions & (BaseOauthHandlerOptions | {})

export class PatreonOauthClient {
    private clientOptions: PatreonOauthClientOptions
    private readonly defaultUserAgent = `PatreonBot patreon-api.ts (https://github.com/ghostrider-05/patreon-api.ts, ${VERSION})`

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
            scopes: 'scopes' in options ? options.scopes ?? [] : [],
            state: 'state' in options ? options.state : undefined,
        }

        if ('redirectUri' in options) this.options.redirectUri = options.redirectUri

        if (options.token) this.cachedToken = 'expires_in_epoch' in options.token
            ? <StoredToken>options.token
            : PatreonOauthClient.toStored(options.token)
    }

    /**
     * The user agent header for requests
     * @returns The header in the client options or the default library header
     */
    public get userAgent (): string {
        return this.clientOptions.userAgent ?? this.defaultUserAgent
    }

    public get fetch () {
        return this.clientOptions.fetch ?? fetch
    }

    protected static async validateToken(
        client: PatreonOauthClient,
        token: StoredToken | string | undefined = client.cachedToken
    ) {
        if (token != undefined && (typeof token === 'object' && !PatreonOauthClient.isExpired(token))) return token
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

    public static async* paginate<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        oauthClient: PatreonOauthClient,
        options?: Oauth2FetchOptions,
    ): AsyncGenerator<GetResponsePayload<Query>, void, unknown> {
        let done = false, page = 1

        while (!done) {
            query.params.set('page[count]', page.toString())
            const pageQuery = createQuery(query.params) as unknown as Query

            const response = await this.fetch(path, pageQuery, oauthClient, options)
            if (response == undefined) break
            yield response

            if ('meta' in response && response.meta.pagination.cursors?.next) {
                page += 1
            } else {
                done = true
            }
        }
    }

    /**
     * Get an Oauth token from an redirect request. This request has a code parameter
     * @param url The request url, or the code, to use for fetching the access token
     * @returns Returns the token on success.
     * Returns undefined for missing code, missing permission or invalid request.
     */
    public async getOauthTokenFromCode (url: string | { code: string }): Promise<StoredToken | undefined> {
        const code = typeof url === 'string'
            ? new URL(url).searchParams.get('code')
            : url.code

        if (!code) return undefined
        if (!this.options.redirectUri) return undefined

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
                redirect_uri: this.options.redirectUri,
            }).toString(),
        }).then(res => res.ok ? res.json() : undefined)

        return token
            ? PatreonOauthClient.toStored(token)
            : undefined
    }

    /**
     * Update an access token with the refresh token
     * @param token The refresh token, or the token with a `refresh_token`, to use
     * @returns the updated access token or undefined on a failed request
     */
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

    /**
     * The uri to redirect users to in the first step of the Oauth flow
     * @returns the url to use for redirecting the user to
     * @throws if the redirectUri is not defined
     */
    public get oauthUri (): string {
        if (!this.options.redirectUri) {
            throw new Error('Missing redirect uri in oauth options')
        }

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.options.clientId,
            redirect_uri: this.options.redirectUri,
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
