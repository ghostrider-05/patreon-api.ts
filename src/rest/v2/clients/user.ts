import { BasePatreonQuery, GetResponsePayload } from '../query'
import { Oauth2FetchOptions, PatreonClient, StoredToken } from './base'

interface UserInstance {
    fetchOauth2: PatreonClient['fetchOauth2']
}

export class PatreonUserClientInstance implements UserInstance {
    public token: StoredToken
    public client: PatreonUserClient

    public constructor (client: PatreonUserClient, token: StoredToken) {
        this.client = client
        this.token = token
    }

    public async fetchOauth2 <Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions | undefined
    ): Promise<GetResponsePayload<Query> | undefined> {
        return await this.client.fetchOauth2<Query>(path, query, {
            ...(options ?? {}),
            token: options?.token ?? this.token,
        })
    }
}

export class PatreonUserClient extends PatreonClient {
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