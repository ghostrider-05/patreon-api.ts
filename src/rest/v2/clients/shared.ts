/* eslint-disable jsdoc/valid-types */
import type {
    GetNormalizedResponsePayload,
    GetSimplifiedResponsePayload,
} from '../../../payloads/v2/normalized/payload'

import {
    type BasePatreonQuery,
    type BasePatreonQueryType,
    type GetResponsePayload,
    QueryBuilder,
    type QueryDefault,
    type Type,
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

export class WriteResourceSharedClient<T extends WriteResourceType, I extends string | null | undefined> {
    protected static get emptyQuery () {
        return QueryBuilder.fromParams(new URLSearchParams())
    }

    public constructor (
        protected resource: T,
        protected oauth: PatreonOauthClient,
        protected config: {
            listRoute: () => string
            itemRoute: (id: string) => string
        },
    ) {}

    public async fetch<Query extends BasePatreonQueryType<T, I extends string | null ? false : true>>(...args: I extends string | null ? [
        id: I,
        query: Query,
        options?: Omit<Oauth2RouteOptions, 'body' | 'contentType'>,
    ] : [
        query: Query,
        options?: Omit<Oauth2RouteOptions, 'body' | 'contentType'>,
    ]): Promise<GetResponsePayload<Query>> {
        if (typeof args[0] === 'string' || args[0] == null) {
            const [id, query, options] = args as [
                id: string | null,
                query: Query,
                options?: Omit<Oauth2RouteOptions, 'body' | 'contentType'>,
            ]

            if (id) return await this.oauth.fetch<Query>(this.config.itemRoute(id), query, options)
            else return await this.oauth.fetch<Query>(this.config.listRoute(), query, options)
        } else {
            const [query, options] = args as [
                query: Query,
                options?: Omit<Oauth2RouteOptions, 'body' | 'contentType'>,
            ]

            return await this.oauth.fetch<Query>(this.config.listRoute(), query, options)
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

export class CrudResourcesSharedClient<T extends WriteResourceType, I extends string | null | undefined>
    extends WriteResourceSharedClient<T, I> {
    public async delete (id: string, options?: Omit<Oauth2RouteOptions, 'body' | 'contentType'>): Promise<void> {
        await this.oauth.fetch(this.config.itemRoute(id), WriteResourceSharedClient.emptyQuery, {
            ...(options ?? {}),
            method: RequestMethod.Delete,
        })
    }
}

// TODO: replace with generics once https://github.com/Microsoft/TypeScript/issues/1213 is closed
export interface ResponseTransformMap<Query extends BasePatreonQuery> {
    default: (res: GetResponsePayload<Query>) => GetResponsePayload<Query>
    simplified: (res: GetResponsePayload<Query>) => GetSimplifiedResponsePayload<Query>
    normalized: (res: GetResponsePayload<Query>) => GetNormalizedResponsePayload<Query>
}

export type ResponseTransformType = keyof ResponseTransformMap<BasePatreonQuery>

export class PatreonSharedClient<TransformType extends ResponseTransformType, IncludeAll extends boolean> {
    public constructor (
        protected _oauth: PatreonOauthClient,
        protected transformType: TransformType,
        private parser: ResponseTransformMap<BasePatreonQuery>[TransformType],
        protected _include_all_query: IncludeAll,
        private _token?: Oauth2CreatorToken | Oauth2StoredToken,
    ) {}

    private setRequestToken (options: Oauth2FetchOptions): Oauth2FetchOptions {
        const token = options.token ?? this._token ?? this._oauth.cachedToken

        return {
            ...options,
            ...(token ? { token } : {}),
        }
    }

    private _replace <Query extends BasePatreonQuery> (res: GetResponsePayload<Query>): ReturnType<ResponseTransformMap<Query>[TransformType]> {
        return this.parser(<never>res)
    }

    private getDefault <T extends Type, L extends boolean>(builder: QueryBuilder<T, L>): QueryDefault<IncludeAll, T, L> {
        return this._include_all_query ? builder.includeAll() : builder
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
            .then(res => this._replace<Query>(res))
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
            yield this._replace<Query>(page.value)
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
        query: Query = this.getDefault(QueryBuilder.campaigns),
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
        query: Query = this.getDefault(QueryBuilder.campaign),
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
        query: Query = this.getDefault(QueryBuilder.member),
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
        query: Query = this.getDefault(QueryBuilder.campaignPosts),
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
        query: Query = this.getDefault(QueryBuilder.member),
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
        query: Query = this.getDefault(QueryBuilder.post),
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
        query: Query = this.getDefault(QueryBuilder.identity),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.identity(), query, options)
    }

    public paginateCampaigns <
        Query extends BasePatreonQueryType<Type.Campaign, true> = QueryDefault<IncludeAll, Type.Campaign, true>
    >(
        // @ts-expect-error Nothing is wrong?
        query: Query = this.getDefault(QueryBuilder.campaigns),
        options?: Oauth2RouteOptions
    ) {
        return this.paginateOauth2<Query>(Routes.campaigns(), query, options)
    }

    public paginateCampaignMembers <
        Query extends BasePatreonQueryType<Type.Member, true> = QueryDefault<IncludeAll, Type.Member, true>
    >(
        campaignId: string,
        // @ts-expect-error Nothing is wrong?
        query: Query = this.getDefault(QueryBuilder.campaignMembers),
        options?: Oauth2RouteOptions
    ) {
        return this.paginateOauth2<Query>(Routes.campaignMembers(campaignId), query, options)
    }

    public paginateCampaignPosts <
        Query extends BasePatreonQueryType<Type.Post, true> = QueryDefault<IncludeAll, Type.Post, true>
    >(
        campaignId: string,
        // @ts-expect-error Nothing is wrong?
        query: Query = this.getDefault(QueryBuilder.campaignPosts),
        options?: Oauth2RouteOptions
    ) {
        return this.paginateOauth2<Query>(Routes.campaignPosts(campaignId), query, options)
    }

    /** @deprecated */
    public listOauth2: PatreonSharedClient<TransformType, IncludeAll>['paginateOauth2'] = (...args) => this.paginateOauth2(...args)
    /** @deprecated */
    public listCampaignPosts: PatreonSharedClient<TransformType, IncludeAll>['paginateCampaignPosts'] = (...args) => this.paginateCampaignPosts(...args)
    /** @deprecated */
    public listCampaignMembers: PatreonSharedClient<TransformType, IncludeAll>['paginateCampaignMembers'] = (...args) => this.paginateCampaignMembers(...args)
    /** @deprecated */
    public listCampaigns: PatreonSharedClient<TransformType, IncludeAll>['paginateCampaigns'] = (...args) => this.paginateCampaigns(...args)
}
