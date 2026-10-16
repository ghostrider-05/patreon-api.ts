import {
    PatreonSharedClient,
    WriteResourceSharedClient,
    type Oauth2FetchOptions,
    type Oauth2RouteOptions,
    type ResponseTransformMap,
    type ResponseTransformType,
} from './shared'

import {
    PatreonOauthClient,
    RestClient,
    Routes,
    type PatreonOauthClientOptions,
    type RestClientOptions,
} from '../oauth2/'

import { WebhookClient } from '../webhooks/'

import {
    normalizeFromQuery,
    simplifyFromQuery,
} from '../../../payloads/v2'

import {
    Type,
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
    rest?: Partial<RestClientOptions<IncludeAll>>
}

export abstract class PatreonClient<IncludeAll extends boolean = false> extends PatreonSharedClient<'default', IncludeAll> {
    /**
     * Interact with the webhooks API.
     *
     * Client to use for creating, updating and getting webhooks from the current client.
     * @see https://docs.patreon.com/#apiv2-webhook-endpoints
     */
    public webhooks: WebhookClient

    /**
     * Interact with the lives API routes.
     *
     * From the Patreon documentation:
     * The Live APIs are early-access, and may be subject to change based on feedback from our partners.
     * @see https://docs.patreon.com/#post-api-oauth2-v2-lives
     */
    public lives: WriteResourceSharedClient<Type.Live, string>

    /**
     * Applies the `simplify` method on all responses.
     *
     * NOTE: due to type complexity, the response might be typed as an union of a paginated and resource response.
     * If this happens, apply the `simplify` method on the default response manually. I have no idea how to fix this bug.
     */
    public simplified: PatreonSharedClient<'simplified', IncludeAll>

    /**
     * Applies the `normalize` method on all responses.
     *
     * NOTE: due to type complexity, the response might be typed as an union of a paginated and resource response.
     * If this happens, apply the `normalize` method on the default response manually. I have no idea how to fix this bug.
     */
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

        this.lives = new WriteResourceSharedClient(Type.Live, oauth, {
            itemRoute: Routes.live,
            listRoute: Routes.lives,
        })
        this.webhooks = new WebhookClient(this.oauth)
    }

    public static hasAllQueriesEnabled <
        Client extends PatreonClient<boolean>
    >(client: Client): boolean {
        return client._include_all_query
    }

    public static createCustomParser <
        Type extends keyof ResponseTransformMap<BasePatreonQuery>,
        IncludeAll extends boolean = boolean
    >(
        client: PatreonClient<IncludeAll>,
        type: Type,
        parser: ResponseTransformMap<BasePatreonQuery>[Type],
        /** TODO: replace with hasAllQueriesEnabled method */
        includeAllQueries: IncludeAll
    ): PatreonSharedClient<Type, IncludeAll> {
        return new PatreonSharedClient(client.oauth, type, parser, includeAllQueries)
    }
}
