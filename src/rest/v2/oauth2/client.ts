import {
    QueryBuilder,
    type BasePatreonQuery,
    type GetResponsePayload,
} from '../../../schemas/v2/query'

import type { Oauth2FetchOptions } from '../clients'

import {
    RequestMethod,
    type RestClient,
    type RequestOptions,
} from './rest/'

import { Oauth2Routes } from './routes'
import { getRequiredScopes } from './scopes'

import type { If } from '../../../utils/generics'

interface OauthClientOptions {
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
    token?: Oauth2CreatorToken | Oauth2Token | Oauth2StoredToken

    /**
     * The type of token is used.
     * Used when validating resources with the given scopes.
     * @default
     * - 'creator' when using a creator client
     * - 'oauth' when using an user client
     */
    tokenType?: 'creator' | 'oauth' | null

    /**
     * Check if the token is given and not expired before running a request.
     *
     * If the token is an object and is expired, the client will refresh the token, update the cached token
     * and use the refreshed token to make an API request.
     * @default false
     */
    validateToken?: boolean

    /**
     * Whether to validate all requests on Oauth clients before sending to check if the correct scopes are given.
     * If the token type is `'creator'`, scope validation will be skipped for this client.
     *
     * Options:
     * - false: disable validation
     * - true: throw on missing scopes for queries
     * - 'warn': log message on missing scopes for queries
     * @default false
     */
    validateScopes?: boolean | 'warn'

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

export interface Oauth2RedirectOptions {
    redirectUri: string
    scopes: string[]
    state: string | undefined
}

export interface Oauth2CreatorToken extends Record<string, string> {
    access_token: string
    refresh_token: string
}

export interface Oauth2Token extends Oauth2CreatorToken {
    expires_in: string
    token_type: string
}

export interface Oauth2StoredToken extends Oauth2Token {
    expires_in_epoch: string
}

/**
 * Client options for handling Oauth
 */
export type PatreonOauthClientOptions = OauthClientOptions & Partial<Oauth2RedirectOptions>

// eslint-disable-next-line jsdoc/require-jsdoc
function makeOauthRequestOptions (
    url: string,
    params: Record<string, string>,
): [string, options: RequestOptions] {
    return ['', {
        route: url,
        auth: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString(),
    }]
}

export class PatreonOauthClient {
    public options: Required<Omit<OauthClientOptions, 'token'>> & Partial<Oauth2RedirectOptions>

    /**
     * The last (updated) token that is stored
     */
    public cachedToken: Oauth2CreatorToken | Oauth2StoredToken | undefined = undefined

    /**
     * Called when the token is refreshed
     * @default <Client>.putStoredToken(token, true)
     */
    public onTokenRefreshed?: (token: Oauth2StoredToken | undefined) => Promise<void> = undefined

    public constructor(
        options: PatreonOauthClientOptions,
        private rest: RestClient,
    ) {
        this.options = {
            accessTokenUri: options.accessTokenUri ?? Oauth2Routes.accessTokenUri,
            authorizationUri: options.authorizationUri ?? Oauth2Routes.authorizationUri,
            clientId: options.clientId,
            clientSecret: options.clientSecret,
            scopes: 'scopes' in options ? options.scopes ?? [] : [],
            state: 'state' in options ? options.state : undefined,
            tokenType: options.tokenType ?? null,
            validateScopes: options.validateScopes ?? false,
            validateToken: options.validateToken ?? false,
        }

        if ('redirectUri' in options) {
            this.options.redirectUri = options.redirectUri
        }

        if (options.token) {
            this.cachedToken = 'expires_in_epoch' in options.token
                ? <Oauth2StoredToken>options.token
                : PatreonOauthClient.toStored(options.token)
        }
    }

    /**
     * The user agent header for requests
     * @returns the (readonly) user agent that is sent on API requests
     */
    public get userAgent(): string {
        return this.rest.userAgent
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
        ) : (options?.token ?? this.cachedToken)

        this.validateScopes(path, query)

        const restOptions = {
            ...options,
            query: query.query,
            accessToken: typeof token === 'string' ? token : token?.access_token,
        }

        return await this.rest.request(path, options?.method ?? RequestMethod.Get, restOptions)
    }

    // eslint-disable-next-line jsdoc/require-yields-type
    /**
     * Make a paginated request to the Patreon API.
     * Abort the loop if either condition is met:
        - no next cursor
        - the previous last item is the same as current last item
        - the total amount of items is equal to the fetched amount
     * @param path the resource path
     * @param query the wrapped query to include fields
     * @param options additional request options
     * @yields a page of the request resource
     * @returns the async generator to paginate through the response.
     */
    public async* paginate<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions,
    ): AsyncGenerator<GetResponsePayload<Query>, number, unknown> {
        let total: number | null = null, page = 1, count = 0
        // Must be a variable as calling a method on the parameter does not update the params.
        const params = query.params
        let lastResourceId: string | undefined = undefined

        while (total == null || (count < total)) {
            const response = await this.fetch(path,
                // @ts-expect-error different constraint
                QueryBuilder.fromParams<Query>(params),
                options,
            )
            if (response == undefined) break
            yield response

            // TODO: add test for this case
            // Abort if the response is not paginated
            if (!('meta' in response)) {
                break
            }

            if (total == null) {
                total = response.meta.pagination.total
            }

            // Abort the loop if either condition is met:
            // - no next cursor
            // - the previous last item is the same as current last item
            // - the total amount of items is equal to the fetched amount
            count += response.data.length
            const lastDataId = response.data.at(-1)?.id
            const nextCursor = response.meta.pagination.cursors?.next

            // TODO: add test for this case
            if (lastResourceId === lastDataId || !nextCursor) {
                break
            } else {
                page += 1
                params.set('page[cursor]', nextCursor)
                lastResourceId = lastDataId
            }
        }

        return page - 1
    }

    /**
     * Get an Oauth token from an redirect request. This request has a code parameter
     * @param url The request url, or the code, to use for fetching the access token
     * @returns Returns the token on success.
     * Returns `undefined` for missing code missing redirect uri.
     * @throws {Error} on a failed request: can be e.g. because of missing permissions or invalid code
     */
    public async getOauthTokenFromCode(url: string | { code: string }): Promise<Oauth2StoredToken | undefined> {
        const code = typeof url === 'string'
            ? new URL(url).searchParams.get('code')
            : url.code

        if (!code) return undefined
        if (!this.options.redirectUri) return undefined

        const options = makeOauthRequestOptions(this.options.accessTokenUri, {
            code,
            client_id: this.options.clientId,
            client_secret: this.options.clientSecret,
            grant_type: 'authorization_code',
            redirect_uri: this.options.redirectUri,
        })

        const token: Oauth2Token = await this.rest.post(...options)

        return token
            ? PatreonOauthClient.toStored<false>(token)
            : undefined
    }

    /**
     * Update an access token with the refresh token
     * @param token The refresh token, or the token with a `refresh_token`, to use
     * @returns the updated access token
     * @throws {Error} on a failed request
     */
    public async refreshToken(token: Oauth2CreatorToken | Oauth2Token | Oauth2StoredToken | string): Promise<Oauth2StoredToken> {
        const refresh_token = typeof token === 'string'
            ? token
            : token.refresh_token

        const options = makeOauthRequestOptions(this.options.accessTokenUri, {
            refresh_token,
            client_id: this.options.clientId,
            client_secret: this.options.clientSecret,
            grant_type: 'refresh_token',
        })

        return await this.rest.post(...options)
    }

    /**
     * The uri to redirect users to in the first step of the Oauth flow
     * @returns the url to use for redirecting the user to
     * @throws {Error} if the redirectUri is not defined or an empty string
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
     * @throws {Error} if the redirectUri is not defined or an empty string, in both the options and client options
     * @returns the uri to redirect the user to in order to authorize this client.
     */
    public createOauthUri(options?: Partial<Oauth2RedirectOptions>) {
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
        if (scopes?.length) params.set('scope', scopes.join(' '))

        return this.options.authorizationUri + '?' + params.toString()
    }

    protected validateScopes (
        path: string,
        query: BasePatreonQuery,
    ): void {
        const validate = this.options.validateScopes
        if (this.options.tokenType === 'creator' || !validate) return

        const requiredScopes = getRequiredScopes.forPath(path, query)
        const missingScopes = requiredScopes.filter(scope => !this.options.scopes?.includes(scope))

        if (missingScopes.length === 0) return

        const msg = `Missing oauth scopes for ${path}: "${missingScopes.join('", "')}"`
        if (validate === 'warn') console.log(msg)
        else throw new Error(msg)
    }

    protected static async validateToken (
        client: PatreonOauthClient,
        token: Oauth2CreatorToken | Oauth2StoredToken | string | undefined = client.cachedToken
    ) {
        if (token != undefined && (typeof token === 'object' && !PatreonOauthClient.isExpired(token))) return token
        if (token == undefined) throw new Error('No token found to validate!')

        // Since the token is the access token, you cannot use this to refresh a token
        if (typeof token === 'string') return

        // TODO: add test for this case
        const refreshed = await client.refreshToken(token)
        await client.onTokenRefreshed?.(refreshed ? this.toStored<false>(refreshed) : undefined)
        if (refreshed) client.cachedToken = refreshed

        return refreshed
    }

    /**
     * Check if a token is likely expired
     * @param token The token to check
     * @returns `true` only if `token.expires_in_epoch` is present and not in the past
     */
    protected static isExpired(token: Oauth2CreatorToken | Oauth2StoredToken): boolean {
        if (!token.expires_in_epoch) return false
        else return Date.now() > parseInt(token.expires_in_epoch)
    }

    /**
     * Create a stored version of a token by including the current timestamp
     * @param token The token to create a stored version of
     * @returns the same token if `expires_in` is missing. Otherwise the stored token version.
     */
    protected static toStored<SupportsCreator extends boolean = true>(
        token: Oauth2Token | Oauth2CreatorToken
    ): If<SupportsCreator, Oauth2StoredToken | Oauth2CreatorToken, Oauth2StoredToken> {
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
