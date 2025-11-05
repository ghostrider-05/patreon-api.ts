import { QueryBuilder } from '../../../schemas/v2'

import { PatreonClient, type PatreonClientOptions, type Oauth2StoredToken } from './base'
import { PatreonSharedClient } from './shared'

export class PatreonUserClientInstance<IncludeAll extends boolean> extends PatreonSharedClient<'default', IncludeAll> {
    public readonly token: Oauth2StoredToken
    public client: PatreonUserClient<boolean>

    public constructor (client: PatreonUserClient<IncludeAll>, token: Oauth2StoredToken) {
        super(client.oauth, 'default', (res) => res, client['_include_all_query'], token)
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
        const query = QueryBuilder.identity
            .addRelationships(['memberships'])
            .setAttributes({ user: ['social_connections'] })

        return await this.fetchIdentity(query, { token: this.token })
            .then(res => {
                const option = <{ user_id: string } | null>(res.data.attributes.social_connections['discord'])
                return option?.user_id
            })
    }
}

export class PatreonUserClient<IncludeAll extends boolean = false> extends PatreonClient<IncludeAll> {
    public constructor (options: PatreonClientOptions<IncludeAll>) {
        super(options, 'oauth')
    }

    /* eslint-disable @typescript-eslint/unified-signatures */
    /**
     * Fetch the token from the incoming redirect request (with a code query).
     * @see {@link PatreonUserClient.oauth}.getOauthTokenFromCode
     * @param {string | { url: string }} request The request or url with the code query
     * @returns {Oauth2StoredToken | undefined} the access token of the user.
     */
    public async fetchToken(request: { url: string }): Promise<Oauth2StoredToken | undefined>;
    public async fetchToken(url: string): Promise<Oauth2StoredToken | undefined>;
    public async fetchToken(request: string | { url: string }): Promise<Oauth2StoredToken | undefined>;
    public async fetchToken(request: string | { url: string }): Promise<Oauth2StoredToken | undefined> {
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
     * @throws {Error} when failed to fetch access token
     */
    public async createInstance (request: string | { url: string }): Promise<PatreonUserClientInstance<IncludeAll>> {
        const token = await this.fetchToken(request)
        if (!token) throw new Error('Failed to fetch access token for: ' + request)

        return new PatreonUserClientInstance(this, token)
    }
}
