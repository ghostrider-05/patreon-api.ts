import {
    PatreonSharedClient,
    type Oauth2FetchOptions,
    type Oauth2RouteOptions,
    type ResponseTransformMap,
    type ResponseTransformType,
} from './shared'

import {
    PatreonOauthClient,
    RestClient,
    type Oauth2StoredToken,
    type PatreonOauthClientOptions,
    type PatreonTokenFetchOptions,
    type RESTOptions,
} from '../oauth2/'

import { WebhookClient } from '../webhooks/'

import {
    normalizeFromQuery,
    simplifyFromQuery,
} from '../../../payloads/v2'

import {
    type BasePatreonQuery,
} from '../../../schemas/v2'

export type {
    ResponseTransformMap,
    ResponseTransformType,
    Oauth2FetchOptions,
    Oauth2RouteOptions,
}

/**
 * The constructor options for API applications
 */
export interface PatreonClientOptions<IncludeAll extends boolean = false> {
    /**
     * The Oauth options for this client.
     * Required for both creator and user clients.
     */
    oauth: PatreonOauthClientOptions

    /**
     * The application name of this client
     */
    name?: string

    /**
     * The rest options for this client
     */
    rest?: Partial<RESTOptions<IncludeAll>>

    /**
     * Options for storing and getting API (creator) tokens.
     * @default undefined
     */
    store?: PatreonTokenFetchOptions
}

export abstract class PatreonClient<IncludeAll extends boolean = false> extends PatreonSharedClient<'default', IncludeAll> {
    private store: PatreonTokenFetchOptions | undefined = undefined

    /**
     * Interact with the webhooks API.
     *
     * Client to use for creating, updating and getting webhooks from the current client.
     */
    public webhooks: WebhookClient

    public simplified: PatreonSharedClient<'simplified', IncludeAll>

    public normalized: PatreonSharedClient<'normalized', IncludeAll>

    // eslint-disable-next-line jsdoc/require-returns
    /**
     * Interact with the API directly.
     * Calling the API using the rest client will not use any of the client options for oauth and tokens.
     */
    public get rest (): RestClient {
        return this._oauth['rest']
    }

    public get oauth (): PatreonOauthClient {
        return this._oauth
    }

    // eslint-disable-next-line jsdoc/require-returns
    /**
     * The application name of the client.
     */
    public get name(): string | null {
        return this._oauth['rest'].name
    }

    public set name (value) {
        this._oauth['rest'].name = value
    }

    public constructor(options: PatreonClientOptions<IncludeAll>, type: 'oauth' | 'creator') {
        options.oauth.tokenType ??= type
        const includeAllQueries = options.rest?.includeAllQueries ?? <IncludeAll>false

        const restClient = new RestClient(options.rest, { name: options.name ?? null })
        const oauth = new PatreonOauthClient(options.oauth, restClient)

        super(oauth, 'default', (res) => res, includeAllQueries)

        this.normalized = new PatreonSharedClient(oauth, 'normalized', normalizeFromQuery, includeAllQueries)
        this.simplified = new PatreonSharedClient(oauth, 'simplified', simplifyFromQuery, includeAllQueries)

        this.webhooks = new WebhookClient(this.oauth)

        this.store = options.store

        this.oauth.onTokenRefreshed = async (token) => {
            if (token) await this.putStoredToken?.(token, true)
        }

        this.oauth['rest'].options.getAccessToken ??= async () => {
            return await this.fetchStoredToken()
                .then(token => token?.access_token)
        }
    }

    public static hasAllQueriesEnabled <
        Client extends PatreonClient<boolean>
    >(client: Client): client is Client & PatreonClient<true> {
        return client._include_all_query
    }

    public static createCustomParser <
        Type extends keyof ResponseTransformMap<BasePatreonQuery>,
        IncludeAll extends boolean = boolean
    >(
        client: PatreonClient<IncludeAll>,
        type: Type,
        parser: ResponseTransformMap<BasePatreonQuery>[Type],
        includeAllQueries: IncludeAll
    ): PatreonSharedClient<Type, IncludeAll> {
        return new PatreonSharedClient(client.oauth, type, parser, includeAllQueries)
    }

    protected static async fetchStored(store?: PatreonTokenFetchOptions): Promise<Oauth2StoredToken | undefined> {
        const stored = await store?.get()
        if (stored == undefined) return undefined

        const { expires_in_epoch } = stored
        stored.expires_in = (Math.round((parseInt(expires_in_epoch) - Date.now()) / 1000)).toString()
        return stored
    }

    /**
     * Fetch the stored token with the `get` method from the client options
     * @returns the stored token, if `options.store.get` is defined and returns succesfully.
     */
    public async fetchStoredToken(): Promise<Oauth2StoredToken | undefined> {
        return PatreonClient.fetchStored(this.store)
    }

    /**
     * Save your token with the method from the client options
     * @param token The token to save
     * @param [cache] Whether to overwrite the application token cache and update it with the token
     */
    public async putStoredToken(token: Oauth2StoredToken, cache?: boolean): Promise<void> {
        await this.store?.put(token)
        if (cache) this.oauth.cachedToken = token
    }
}
