import { buildQuery } from '../query'
import { BasePatreonClient, type StoredToken } from './base'
import { BasePatreonClientMethods } from './baseMethods'

interface UserInstance {
    fetchOauth2: BasePatreonClient['fetchOauth2']
}

export class PatreonUserClientInstance extends BasePatreonClientMethods implements UserInstance {
    public readonly token: StoredToken
    public client: PatreonUserClient

    public constructor (client: PatreonUserClient, token: StoredToken) {
        super(client['oauthClient'], client['fetch'], token)
        this.client = client
        this.token = token
    }

    /**
     * Fetch the ID of the Discord connection.
     *
     * This will only work if the current token is associated with the user.
     */
    public async fetchDiscordId () {
        return await this.fetchIdentity(buildQuery.identity(['memberships'])({ user: ['social_connections' ]}))
            .then(res => res?.data.attributes.social_connections.discord)
    }
}

export class PatreonUserClient extends BasePatreonClient {
    public override async fetchToken(request: { url: string }): Promise<StoredToken>;
    public override async fetchToken(url: string): Promise<StoredToken>;
    public override async fetchToken(request: string | { url: string }): Promise<StoredToken>;
    public override async fetchToken(request: string | { url: string }): Promise<StoredToken> {
        const url = typeof request === 'string'
            ? request
            : request.url

        const token = await super.fetchToken(url)
        return token
    }

    public async createInstance (request: string | { url: string }) {
        const token = await this.fetchToken(request)

        return new PatreonUserClientInstance(this, token)
    }
}
