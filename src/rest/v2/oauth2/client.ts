import type { Oauth2FetchOptions } from '../clients'
import { createQuery, type BasePatreonQuery, type GetResponsePayload } from '../query'

import { type RestClient } from './rest'

import type { If } from '../../../utils/generics'

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
    token?: CreatorToken | Token | StoredToken

    /**
     * Check if the token is given and not expired before running a request
     * @default true
     */
    validateToken?: boolean

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
}

export interface BaseOauthHandlerOptions {
    redirectUri: string
    scopes?: string[]
    state?: string | undefined
}

export interface CreatorToken extends Record<string, string> {
    access_token: string
    refresh_token: string
}

export interface Token extends CreatorToken {
    expires_in: string
    token_type: string
}

export interface StoredToken extends Token {
    expires_in_epoch: string
}

type OauthOptions = Partial<Pick<BaseOauthHandlerOptions, 'redirectUri' | 'scopes' | 'state'>>
    & Required<Pick<BaseOauthClientOptions, 'validateToken' | 'clientId' | 'clientSecret' | 'accessTokenUri' | 'authorizationUri'>>

/**
 * Client options for handling Oauth
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type PatreonOauthClientOptions = BaseOauthClientOptions & (BaseOauthHandlerOptions | {})

export class PatreonOauthClient {
    public options: OauthOptions

    /**
     * The last (updated) token that is stored
     */
    public cachedToken: CreatorToken | StoredToken | undefined = undefined

    /**
     * Called when the token is refreshed
     * @default <Client>.putStoredToken(token, true)
     */
    public onTokenRefreshed?: (token: StoredToken | undefined) => Promise<void> = undefined

    public constructor(
        options: PatreonOauthClientOptions,
        private rest: RestClient,
    ) {
        this.options = {
            accessTokenUri: options.accessTokenUri ?? 'https://patreon.com/api/oauth2/token',
            authorizationUri: options.authorizationUri ?? 'https://patreon.com/oauth2/authorize',
            clientId: options.clientId,
            clientSecret: options.clientSecret,
            scopes: 'scopes' in options ? options.scopes ?? [] : [],
            state: 'state' in options ? options.state : undefined,
            validateToken: options.validateToken ?? true,
        }

        if ('redirectUri' in options) this.options.redirectUri = options.redirectUri

        if (options.token) this.cachedToken = 'expires_in_epoch' in options.token
            ? <StoredToken>options.token
            : PatreonOauthClient.toStored(options.token)
    }

    private async makeOauthRequest<T>(url: string, params: Record<string, string>) {
        return await this.rest.post<T>('', {
            route: url,
            auth: false,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(params).toString(),
        }) as Promise<T>
    }

    /**
     * The user agent header for requests
     * @returns the (readonly) user agent that is sent on API requests
     */
    public get userAgent(): string {
        return this.rest.userAgent
    }

    protected static async validateToken(
        client: PatreonOauthClient,
        token: CreatorToken | StoredToken | string | undefined = client.cachedToken
    ) {
        if (token != undefined && (typeof token === 'object' && !PatreonOauthClient.isExpired(token))) return token
        if (token == undefined) throw new Error('No token found to validate!')

        const refreshed = await client.refreshToken(token)
        await client.onTokenRefreshed?.(refreshed ? this.toStored<false>(refreshed) : undefined)
        if (refreshed) client.cachedToken = refreshed

        return refreshed
    }

    /**
     * @deprecated
     */
    public static async fetch<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        oauthClient: PatreonOauthClient,
        options?: Oauth2FetchOptions,
    ): Promise<GetResponsePayload<Query>> {
        return oauthClient.fetch(path, query, options)
    }

    /** @deprecated */
    public static async* paginate<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        oauthClient: PatreonOauthClient,
        options?: Oauth2FetchOptions,
    ): AsyncGenerator<GetResponsePayload<Query>, number, unknown> {
        const paginator = oauthClient.paginate(path, query, options)

        let page = await paginator.next()
        while (!page.done) {
            yield page.value
            page = await paginator.next()
        }

        return page.value
    }

    /**
     * Make a request to the Patreon API
     * @param path the path of the resource
     * @param query The query wrapper to include more fields
     * @param options additional request options
     * @returns the response body, parsed.
     */
    public async fetch<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions,
    ): Promise<GetResponsePayload<Query>> {
        const token = this.options.validateToken ? await PatreonOauthClient.validateToken(
            this,
            options?.token
        ) : options?.token

        return await this.rest.request({
            ...options,
            path,
            query: query.query,
            accessToken: typeof token === 'string' ? token : token?.access_token,
        })
    }

    /**
     * Make a paginated request to the Patreon API.
     * @param path the resource path
     * @param query the wrapped query to include fields
     * @param options additional request options
     * @yields a page of the request resource
     * @returns the async generator to paginate through the response.
     * @example See `./examples/README.md` in the GitHub repo
     */
    public async* paginate<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions,
    ): AsyncGenerator<GetResponsePayload<Query>, number, unknown> {
        let done = false, page = 1
        let cursor: string | undefined = undefined

        while (!done) {
            if (cursor) query.params.set('page[cursor]', cursor)
            const pageQuery = createQuery(query.params) as unknown as Query

            const response = await this.fetch(path, pageQuery, options)
            if (response == undefined) break
            yield response

            if ('meta' in response && response.meta.pagination.cursors?.next) {
                page += 1
                cursor = response.meta.pagination.cursors.next
            } else {
                done = true
            }
        }

        return page
    }

    /**
     * Get an Oauth token from an redirect request. This request has a code parameter
     * @param url The request url, or the code, to use for fetching the access token
     * @returns Returns the token on success.
     * Returns `undefined` for missing code missing redirect uri.
     * @throws on a failed request: can be e.g. because of missing permissions or invalid code
     */
    public async getOauthTokenFromCode(url: string | { code: string }): Promise<StoredToken | undefined> {
        const code = typeof url === 'string'
            ? new URL(url).searchParams.get('code')
            : url.code

        if (!code) return undefined
        if (!this.options.redirectUri) return undefined

        const token: Token = await this.makeOauthRequest(this.options.accessTokenUri, {
            code,
            client_id: this.options.clientId,
            client_secret: this.options.clientSecret,
            grant_type: 'authorization_code',
            redirect_uri: this.options.redirectUri,
        })

        return token
            ? PatreonOauthClient.toStored<false>(token)
            : undefined
    }

    /**
     * Update an access token with the refresh token
     * @param token The refresh token, or the token with a `refresh_token`, to use
     * @returns the updated access token
     * @throws on a failed request
     */
    public async refreshToken(token: CreatorToken | Token | StoredToken | string): Promise<StoredToken> {
        const refresh_token = typeof token === 'string'
            ? token
            : token.refresh_token

        return await this.makeOauthRequest(this.options.accessTokenUri, {
            refresh_token,
            client_id: this.options.clientId,
            client_secret: this.options.clientSecret,
            grant_type: 'refresh_token',
        })
    }

    /**
     * The uri to redirect users to in the first step of the Oauth flow
     * @returns the url to use for redirecting the user to
     * @throws if the redirectUri is not defined or an empty string
     */
    public get oauthUri(): string {
        return this.createOauthUri()
    }

    /**
     * Create a Oauth2 Authorization uri. This is the first step in the Oauth2 process.
     * @param options The Oauth2 client options
     * @param options.redirectUri The uri to redirect to after authorization
     * @param options.scopes The scopes to request for this client.
     * @param options.state The state to check after authorization.
     * @throws if the redirectUri is not defined or an empty string, in both the options and client options
     * @returns the uri to redirect the user to in order to authorize this client.
     */
    public createOauthUri(options?: { redirectUri?: string, scopes?: string[], state?: string }) {
        const redirectUri = options?.redirectUri ?? this.options.redirectUri

        if (!redirectUri) {
            throw new Error('Missing redirect uri in oauth options')
        }

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.options.clientId,
            redirect_uri: redirectUri,
        })

        const state = options?.state ?? this.options.state
        const scopes = options?.scopes ?? this.options.scopes

        if (state) params.set('state', state)
        if (scopes?.length) params.set('scopes', scopes.join(','))

        return this.options.authorizationUri + '?' + params.toString()
    }

    /**
     * Check if a token is likely expired
     * @param token The token to check
     * @returns `true` only if `token.expires_in_epoch` is present and not in the past
     */
    public static isExpired(token: CreatorToken | StoredToken): boolean {
        if (!token.expires_in_epoch) return false
        else return Date.now() > parseInt(token.expires_in_epoch)
    }

    /**
     * Create a stored version of a token by including the current timestamp
     * @param token The token to create a stored version of
     * @returns the same token if `expires_in` is missing. Otherwise the stored token version.
     */
    public static toStored<SupportsCreator extends boolean = true>(token: Token | CreatorToken): If<SupportsCreator, StoredToken | CreatorToken, StoredToken> {
        if (!token.expires_in) return <never>token
        const now = new Date()
        now.setSeconds(now.getSeconds() + parseInt(token.expires_in))

        return <never>{
            ...token,
            expires_in_epoch: now
                .getTime()
                .toString(),
        }
    }
}
