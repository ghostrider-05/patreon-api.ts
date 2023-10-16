import ClientOAuth2 from 'client-oauth2'

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
    protected options: ClientOAuth2.Options
    protected oauth2: ClientOAuth2
    protected cachedToken: ClientOAuth2.Token | undefined = undefined

    public constructor(
        options: BaseOauthClientOptions & (BaseOauthHandlerOptions | object),
        token?: Token
    ) {
        this.options = {
            accessTokenUri: 'www.patreon.com/api/oauth2/token',
            authorizationUri: 'www.patreon.com/oauth2/authorize',
            clientId: options.clientId,
            clientSecret: options.clientSecret,
        }

        if ('redirectUri' in options) this.options.redirectUri = options.redirectUri
        if ('state' in options && options.state) this.options.state = options.state
        if ('scopes' in options && options.scopes) this.options.scopes = options.scopes

        this.oauth2 = new ClientOAuth2(this.options)
        if (token) this.cachedToken = this.oauth2.createToken(token)
    }

    public static getTokenData(token: ClientOAuth2.Token): Token {
        return <Token>token.data
    }

    public static getExpiresEpoch(token: ClientOAuth2.Token): { expires_in_epoch: string } {
        return {
            expires_in_epoch: token
                .expiresIn(parseInt(token.data.expires_in))
                .getTime()
                .toString(),
        }
    }

    protected static toStored(token: ClientOAuth2.Token): StoredToken {
        return {
            ...this.getTokenData(token),
            ...this.getExpiresEpoch(token),
        }
    }

    protected async _fetchToken(requestUrl: string, type: 'code' | 'credentials', cache = true) {
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

    protected toRaw (token: Token): ClientOAuth2.Token {
        return this.oauth2.createToken(token)
    }

    /**
     *
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
     * @returns if the token is updated and stored, and the token
     */
    public async fetchApplicationToken() {
        return await this._fetchToken('', 'credentials', true)
            .then(raw => ({ success: raw != undefined, token: PatreonOauthClient.toStored(raw) }))
    }
}