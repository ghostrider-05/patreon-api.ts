import { buildQuery } from '../query'
import { PatreonClient, type PatreonClientOptions, type StoredToken } from './base'
import { PatreonClientMethods } from './baseMethods'

export class PatreonUserClientInstance extends PatreonClientMethods<boolean> {
    public readonly token: StoredToken
    public client: PatreonUserClient<boolean>

    public constructor (client: PatreonUserClient<boolean>, token: StoredToken) {
        super(client['rawOauthOptions'], client.oauth['rest'].options, client.name, token)
        this.client = client
        this.token = token
    }

    /**
     * Fetch the ID of the Discord connection.
     *
     * This will only work if the current token is associated with the user.
     * @returns The discord user ID
     */
    public async fetchDiscordId (): Promise<string | undefined> {
        const query = buildQuery.identity(['memberships'])({ user: ['social_connections' ]})

        return await this.fetchIdentity(query, { token: this.token })
            .then(res => {
                const option = <{ user_id: string } | null>(res.data.attributes.social_connections['discord'])
                return option?.user_id
            })
    }
}

/* eslint-disable @typescript-eslint/unified-signatures */

export class PatreonUserClient<IncludeAll extends boolean = false> extends PatreonClient<IncludeAll> {
    public constructor (options: PatreonClientOptions<IncludeAll>) {
        super(options, 'oauth')
    }

    /**
     * Fetch the token from the incoming redirect request (with a code query).
     * @see {@link PatreonUserClient.oauth.getOauthTokenFromCode}
     * @param {string | { url: string }} request The request or url with the code query
     * @returns {StoredToken | undefined} the access token of the user.
     */
    public async fetchToken(request: { url: string }): Promise<StoredToken | undefined>;
    public async fetchToken(url: string): Promise<StoredToken | undefined>;
    public async fetchToken(request: string | { url: string }): Promise<StoredToken | undefined>;
    public async fetchToken(request: string | { url: string }): Promise<StoredToken | undefined> {
        const url = typeof request === 'string'
            ? request
            : request.url

        const token = await this.oauth.getOauthTokenFromCode(url)
        return token
    }

    /**
     * Create a client with the current user authenticated.
     * @param request The request or url with the code query
     * @returns a similar Oauth client that has the token of the current token
     * @throws when failed to fetch access token
     */
    public async createInstance (request: string | { url: string }): Promise<PatreonUserClientInstance> {
        const token = await this.fetchToken(request)
        if (!token) throw new Error('Failed to fetch access token for: ' + request)

        return new PatreonUserClientInstance(this, token)
    }
}
