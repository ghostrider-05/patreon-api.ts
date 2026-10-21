import {
    PatreonSharedClient,
    type Oauth2FetchOptions,
    type Oauth2RouteOptions,
} from './shared'

import {
    type ResponseTransformMap,
    type ResponseTransformType,
    type PatreonClientTransformOptions,
} from './transform'

import {
    PatreonOauthClient,
    RestClient,
    type PatreonOauthClientOptions,
    type RestClientOptions,
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
    PatreonClientTransformOptions,
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

    /**
     * Options for transforming the API response.
     */
    transform?: Partial<PatreonClientTransformOptions<IncludeAll>>
}

export abstract class PatreonClient<IncludeAll extends boolean = false> extends PatreonSharedClient<'default', IncludeAll> {
    /**
     * Interact with the webhooks API.
     *
     * Client to use for creating, updating and getting webhooks from the current client.
     * @see https://docs.patreon.com/#apiv2-webhook-endpoints
     */
    public webhooks: WebhookClient<IncludeAll>

    /**
     * Applies the `simplify` method on all responses.
     */
    public simplified: PatreonSharedClient<'simplified', IncludeAll>

    /**
     * Applies the `normalize` method on all responses.
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

    public constructor (options: PatreonClientOptions<IncludeAll>) {
        const transformOptions: PatreonClientTransformOptions<IncludeAll> = {
            includeAllQueries: options.transform?.includeAllQueries
                ?? options.rest?.includeAllQueries
                ?? <IncludeAll>false
        }

        const restClient = new RestClient(options.rest, { name: options.name ?? null })
        const oauth = new PatreonOauthClient(options.oauth, restClient)

        super(oauth, {
            transform: {
                transformType: 'default',
                parser: (res) => res,
                ...transformOptions,
            },
        })

        this.normalized = new PatreonSharedClient(oauth, {
            transform: {
                transformType: 'normalized',
                parser: normalizeFromQuery,
                ...transformOptions,
            },
        })
        this.simplified = new PatreonSharedClient(oauth, {
            transform: {
                transformType: 'simplified',
                parser: simplifyFromQuery,
                ...transformOptions,
            },
        })

        this.webhooks = new WebhookClient(this.oauth, {
            transform: transformOptions,
        })
    }

    public static hasAllQueriesEnabled <
        Client extends PatreonClient<boolean>
    >(client: Client): boolean {
        return client._include_all_query
    }

    public static createCustomParser <
        TransformType extends keyof ResponseTransformMap<BasePatreonQuery>,
        IncludeAll extends boolean = boolean
    >(
        client: PatreonClient<IncludeAll>,
        transformType: TransformType,
        parser: ResponseTransformMap<BasePatreonQuery>[TransformType],
    ): PatreonSharedClient<TransformType, IncludeAll> {
        return new PatreonSharedClient(client.oauth, {
            transform: {
                transformType,
                includeAllQueries: client._include_all_query,
                parser,
            },
            token: client['_token'],
        })
    }
}
