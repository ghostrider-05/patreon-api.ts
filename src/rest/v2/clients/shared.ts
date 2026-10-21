/* eslint-disable jsdoc/valid-types */
import {
    type BasePatreonQuery,
    type BasePatreonQueryType,
    QueryBuilder,
    type QueryDefault,
    Type,
    type WriteResourceType,
    type WriteResourcePayload,
    type WriteResourceResponse,
} from '../../../schemas/v2'

import {
    PatreonOauthClient,
    type Oauth2CreatorToken,
    type Oauth2StoredToken,
} from '../oauth2/client'

import {
    RequestMethod,
    type RequestOptions,
} from '../oauth2/rest'

import { Routes } from '../oauth2/routes'

import {
    type ResponseTransformMap,
    type ResponseTransformType,
    TransformClient,
    type TransformClientOptions,
} from './transform'

/**
 * Options for the raw Oauth2 request methods
 */
export interface Oauth2FetchOptions extends Omit<RequestOptions,
    | 'route'
    | 'accessToken'
    | 'query'
> {
    /**
     * Overwrite the client token with a new (access) token
     * @default undefined
     */
    token?: Oauth2StoredToken | Oauth2CreatorToken | string

    /**
     * Overwrite the method of the request.
     * If you are using a function to write, update or delete resources this will be already set.
     * @default 'GET'
     */
    method?: RequestMethod | `${RequestMethod}`
}

/**
 * Options for the `fetch*` and `list*` Oauth2 methods
 */
export type Oauth2RouteOptions = Omit<Oauth2FetchOptions, 'method'>

interface WriteClientConfig<T extends Type, IdParam extends string | null | undefined> {
    listRoute: () => string
    itemRoute: (id: string) => string
    idParam: IdParam
    listQuery: IdParam extends undefined ? QueryBuilder<T, true> : null
    itemQuery: IdParam extends undefined ? null : QueryBuilder<T, false>
}

export class WriteResourceSharedClient<
    T extends WriteResourceType,
    TransformType extends ResponseTransformType,
    IncludeAll extends boolean,
    IdParam extends string | null | undefined,
> extends TransformClient<TransformType, IncludeAll> {
    protected static get emptyQuery () {
        return QueryBuilder.fromParams(new URLSearchParams())
    }

    public constructor (
        protected resource: T,
        protected oauth: PatreonOauthClient,
        protected config: WriteClientConfig<T, IdParam>,
        transformOptions: TransformClientOptions<TransformType, IncludeAll>,
    ) {
        super(transformOptions)
    }

    public async fetch<
        Query extends BasePatreonQueryType<T, IdParam extends string | null ? false : true>
            = QueryDefault<IncludeAll, T, IdParam extends string | null ? false : true>
    >(...args: IdParam extends string | null ? [
        id: IdParam,
        query?: Query,
        options?: Omit<Oauth2RouteOptions, 'body' | 'contentType'>,
    ] : [
        query?: Query,
        options?: Omit<Oauth2RouteOptions, 'body' | 'contentType'>,
    ]): Promise<ReturnType<ResponseTransformMap<Query>[TransformType]>> {
        if (typeof args[0] === 'string' || args[0] == null) {
            const [id, query, options] = args as [
                id: string | null,
                query?: Query,
                options?: Omit<Oauth2RouteOptions, 'body' | 'contentType'>,
            ]

            if (id) return await this.oauth.fetch<Query>(
                this.config.itemRoute(id),
                //@ts-expect-error Default query
                query ?? this.getDefaultQuery(this.config.itemQuery),
                options,
            ).then(res => this.parseResponse(res))
            else return await this.oauth.fetch<Query>(
                this.config.listRoute(),
                //@ts-expect-error Default query
                query ?? this.getDefaultQuery(this.config.listQuery),
                options,
            ).then(res => this.parseResponse(res))
        } else {
            const [query, options] = args as [
                query?: Query,
                options?: Omit<Oauth2RouteOptions, 'body' | 'contentType'>,
            ]

            return await this.oauth.fetch<Query>(
                this.config.listRoute(),
                //@ts-expect-error Default query
                query ?? this.getDefaultQuery(this.config.listQuery),
                options,
            ).then(res => this.parseResponse(res))
        }
    }

    public async create (
        resource: Omit<WriteResourcePayload<T, RequestMethod.Post>['data'], 'type'>,
        options?: Omit<Oauth2RouteOptions, 'body' | 'contentType'>,
    ) {
        const body: WriteResourcePayload<T, RequestMethod.Post> = {
            data: {
                type: this.resource,
                attributes: resource.attributes,
                ...('relationships' in resource ? { relationships: resource.relationships } : {}),
            } as unknown as WriteResourcePayload<T, RequestMethod.Post>['data'],
        }

        return await this.oauth.fetch(this.config.listRoute(), WriteResourceSharedClient.emptyQuery, {
            ...(options ?? {}),
            method: RequestMethod.Post,
            body: JSON.stringify(body),
            // Typecast needed because of empty query
        }) as unknown as WriteResourceResponse<T>
    }

    public async edit (
        resource: { id: string } & WriteResourcePayload<T, RequestMethod.Patch>['data']['attributes'],
        options?: Omit<Oauth2RouteOptions, 'body' | 'contentType'>,
    ): Promise<WriteResourceResponse<T>> {
        const { id, ...attributes } = resource

        // It is not possible currently to edit relationships of a resource
        const body: WriteResourcePayload<T, RequestMethod.Patch> = {
            data: {
                type: this.resource,
                id,
                attributes,
            } as WriteResourcePayload<T, RequestMethod.Patch>['data'],
        }

        return await this.oauth.fetch(this.config.itemRoute(id), WriteResourceSharedClient.emptyQuery, {
            ...(options ?? {}),
            method: RequestMethod.Patch,
            body: JSON.stringify(body),
            // Typecast needed because of empty query
        }) as unknown as WriteResourceResponse<T>
    }
}

export class CrudResourcesSharedClient<
    T extends WriteResourceType,
    TransformType extends ResponseTransformType,
    IncludeAll extends boolean,
    IdParam extends string | null | undefined,
> extends WriteResourceSharedClient<T, TransformType, IncludeAll, IdParam> {
    public async delete (id: string, options?: Omit<Oauth2RouteOptions, 'body' | 'contentType'>): Promise<void> {
        await this.oauth.fetch(this.config.itemRoute(id), WriteResourceSharedClient.emptyQuery, {
            ...(options ?? {}),
            method: RequestMethod.Delete,
        })
    }
}

export class PatreonSharedClient<TransformType extends ResponseTransformType, IncludeAll extends boolean> extends TransformClient<TransformType, IncludeAll> {
    private _token: Oauth2CreatorToken | Oauth2StoredToken | undefined

    /**
     * Interact with the lives API routes.
     *
     * From the Patreon documentation:\
     * The Live APIs are early-access, and may be subject to change based on feedback from our partners.
     * @see https://docs.patreon.com/#post-api-oauth2-v2-lives
     */
    public lives: WriteResourceSharedClient<Type.Live, TransformType, IncludeAll, string>

    public constructor (
        protected _oauth: PatreonOauthClient,
        options: {
            transform: TransformClientOptions<TransformType, IncludeAll>
            token?: Oauth2CreatorToken | Oauth2StoredToken | undefined
        },
    ) {
        super(options.transform)

        this._token = options.token
        this.lives = new WriteResourceSharedClient(Type.Live, _oauth, {
            itemRoute: Routes.live,
            listRoute: Routes.lives,
            idParam: '',
            itemQuery: QueryBuilder.live,
            listQuery: null,
        }, options.transform)
    }

    private setRequestToken (options: Oauth2FetchOptions): Oauth2FetchOptions {
        const token = options.token ?? this._token ?? this._oauth.cachedToken

        return {
            ...options,
            ...(token ? { token } : {}),
        }
    }

    /**
     * Fetch the Patreon Oauth V2 API
     * @param path The Oauth V2 API Route
     * @param query The query builder with included fields and attributes
     * @param options Request options
     * @returns the response for succesful requests
     * @throws {Error} on failed request
     */
    public async fetchOauth2<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions | undefined
    ): Promise<ReturnType<ResponseTransformMap<Query>[TransformType]>> {
        const requestOptions = this.setRequestToken(options ?? {})

        return await this._oauth.fetch(path, query, requestOptions)
            .then(res => this.parseResponse<Query>(res))
    }

    // eslint-disable-next-line jsdoc/require-yields-type
    /**
     * Paginate the Patreon Oauth V2 API until all pages are fetched
     * @param path The Oauth V2 API Route
     * @param query The query builder with included fields and attributes
     * @param options Request options
     * @yields a page of response data
     * @returns the amount of pages fetched
     */
    public async *paginateOauth2<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions | undefined
    ): AsyncGenerator<ReturnType<ResponseTransformMap<Query>[TransformType]>, number, unknown> {
        const requestOptions = this.setRequestToken(options ?? {})

        const paginator = this._oauth.paginate(path, query, requestOptions)

        let page = await paginator.next()
        while (!page.done) {
            yield this.parseResponse<Query>(page.value)
            page = await paginator.next()
        }

        return page.value
    }

    /**
     * Fetch campaigns.
     * This returns a single page of campaigns, to paginate through more pages see {@link paginateCampaigns}.
     * @param query The query for requesting relationships and attributes
     * @param options The request options. Allows for authentication (token) and fetch options.
     * @returns The API response for the route. If using a (client) response parser, the response will be transformed.
     * @see https://docs.patreon.com/#get-api-oauth2-v2-campaigns
     * @requires `campaigns` scope.
     */
    public async fetchCampaigns <
        Query extends BasePatreonQueryType<Type.Campaign, true> = QueryDefault<IncludeAll, Type.Campaign, true>
    >(
        // @ts-expect-error Nothing is wrong?
        query: Query = this.getDefaultQuery(QueryBuilder.campaigns),
        options?: Oauth2RouteOptions,
    ) {
        return await this.fetchOauth2<Query>(Routes.campaigns(), query, options)
    }

    /**
     * Fetch a campaign.
     * @param campaignId The id of the campaign to return.
     * @param query The query for requesting relationships and attributes
     * @param options The request options. Allows for authentication (token) and fetch options.
     * @returns The API response for the route. If using a (client) response parser, the response will be transformed.
     * @see https://docs.patreon.com/#get-api-oauth2-v2-campaigns-campaign_id
     * @requires `campaigns` scope.
     */
    public async fetchCampaign <
        Query extends BasePatreonQueryType<Type.Campaign, false> = QueryDefault<IncludeAll, Type.Campaign, false>
    >(
        campaignId: string,
        // @ts-expect-error Nothing is wrong?
        query: Query = this.getDefaultQuery(QueryBuilder.campaign),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.campaign(campaignId), query, options)
    }

    /**
     * Fetch campaign members.
     * This returns a single page of members, to paginate through more pages see {@link paginateCampaignMembers}.
     * @param campaignId The campaign id of the members
     * @param query The query for requesting relationships and attributes
     * @param options The request options. Allows for authentication (token) and fetch options.
     * @returns The API response for the route. If using a (client) response parser, the response will be transformed.
     * @see https://docs.patreon.com/#get-api-oauth2-v2-campaigns-campaign_id-members
     * @requires `campaigns.members` scope.
     * For the address the `campaigns.members.address` scope is required.
     */
    public async fetchCampaignMembers <
        Query extends BasePatreonQueryType<Type.Member, true> = QueryDefault<IncludeAll, Type.Member, true>
    >(
        campaignId: string,
        // @ts-expect-error Nothing is wrong?
        query: Query = this.getDefaultQuery(QueryBuilder.member),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.campaignMembers(campaignId), query, options)
    }

    /**
     * Fetch campaign posts.
     * This returns a single page of posts, to paginate through more pages see {@link paginateCampaignPosts}.
     * @param campaignId The campaign id of the posts
     * @param query The query for requesting relationships and attributes
     * @param options The request options. Allows for authentication (token) and fetch options.
     * @returns The API response for the route. If using a (client) response parser, the response will be transformed.
     * @see https://docs.patreon.com/#get-api-oauth2-v2-campaigns-campaign_id-posts
     * @requires `campaigns.posts` scope
     */
    public async fetchCampaignPosts <
        Query extends BasePatreonQueryType<Type.Post, true> = QueryDefault<IncludeAll, Type.Post, true>
    >(
        campaignId: string,
        // @ts-expect-error Nothing is wrong?
        query: Query = this.getDefaultQuery(QueryBuilder.campaignPosts),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.campaignPosts(campaignId), query, options)
    }

    /**
     * Fetch a member.
     * @param memberId The id of the member to return.
     * @param query The query for requesting relationships and attributes
     * @param options The request options. Allows for authentication (token) and fetch options.
     * @returns The API response for the route. If using a (client) response parser, the response will be transformed.
     * @see https://docs.patreon.com/#get-api-oauth2-v2-members-member_id
     * @requires `campaigns.members` scope.
     */
    public async fetchMember <
        Query extends BasePatreonQueryType<Type.Member, false> = QueryDefault<IncludeAll, Type.Member, false>
    >(
        memberId: string,
        // @ts-expect-error Nothing is wrong?
        query: Query = this.getDefaultQuery(QueryBuilder.member),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.member(memberId), query, options)
    }

    /**
     * Fetch a post.
     * @param postId The id of the post to return.
     * @param query The query for requesting relationships and attributes
     * @param options The request options. Allows for authentication (token) and fetch options.
     * @returns The API response for the route. If using a (client) response parser, the response will be transformed.
     * @see https://docs.patreon.com/#get-api-oauth2-v2-posts-id
     * @requires `campaigns.posts` scope.
     */
    public async fetchPost <
        Query extends BasePatreonQueryType<Type.Post, false> = QueryDefault<IncludeAll, Type.Post, false>
    >(
        postId: string,
        // @ts-expect-error Nothing is wrong?
        query: Query = this.getDefaultQuery(QueryBuilder.post),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.post(postId), query, options)
    }

    /**
     * Fetch the current user for the oauth token.
     * @param query The query for requesting relationships and attributes
     * @param options The request options. Allows for authentication (token) and fetch options.
     * @returns The API response for the route. If using a (client) response parser, the response will be transformed.
     * @see https://docs.patreon.com/#get-api-oauth2-v2-identity
     * @requires `identity` scope.
     */
    public async fetchIdentity <
        Query extends BasePatreonQueryType<Type.User, false> = QueryDefault<IncludeAll, Type.User, false>
    >(
        // @ts-expect-error Nothing is wrong?
        query: Query = this.getDefaultQuery(QueryBuilder.identity),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.identity(), query, options)
    }

    public paginateCampaigns <
        Query extends BasePatreonQueryType<Type.Campaign, true> = QueryDefault<IncludeAll, Type.Campaign, true>
    >(
        // @ts-expect-error Nothing is wrong?
        query: Query = this.getDefaultQuery(QueryBuilder.campaigns),
        options?: Oauth2RouteOptions
    ) {
        return this.paginateOauth2<Query>(Routes.campaigns(), query, options)
    }

    public paginateCampaignMembers <
        Query extends BasePatreonQueryType<Type.Member, true> = QueryDefault<IncludeAll, Type.Member, true>
    >(
        campaignId: string,
        // @ts-expect-error Nothing is wrong?
        query: Query = this.getDefaultQuery(QueryBuilder.campaignMembers),
        options?: Oauth2RouteOptions
    ) {
        return this.paginateOauth2<Query>(Routes.campaignMembers(campaignId), query, options)
    }

    public paginateCampaignPosts <
        Query extends BasePatreonQueryType<Type.Post, true> = QueryDefault<IncludeAll, Type.Post, true>
    >(
        campaignId: string,
        // @ts-expect-error Nothing is wrong?
        query: Query = this.getDefaultQuery(QueryBuilder.campaignPosts),
        options?: Oauth2RouteOptions
    ) {
        return this.paginateOauth2<Query>(Routes.campaignPosts(campaignId), query, options)
    }
}
