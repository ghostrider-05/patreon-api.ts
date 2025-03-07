/* eslint-disable jsdoc/require-returns */
/* eslint-disable jsdoc/require-param */
import { normalizeFromQuery, simplifyFromQuery } from '../../../payloads/v2'
import { QueryBuilder, type QueryDefault, type Type } from '../../../schemas/v2'

import type {
    BasePatreonQuery,
    BasePatreonQueryType,
    GetResponsePayload,
} from '../query'

import {
    PatreonOauthClient,
    type CreatorToken,
    type PatreonOauthClientOptions,
    type StoredToken,
} from '../oauth2/client'

import {
    RestClient,
    type RequestMethod,
    type RequestOptions,
    type RESTOptions,
} from '../oauth2/rest'

import { Routes } from '../oauth2/routes'

type BaseFetchOptions = Omit<RequestOptions,
    | 'route'
    | 'accessToken'
    | 'query'
>

/**
 * Options for the raw Oauth2 request methods
 */
export interface Oauth2FetchOptions extends BaseFetchOptions {
    /**
     * Overwrite the client token with a new (access) token
     * @default undefined
     */
    token?: StoredToken | CreatorToken | string

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

// TODO: replace with generics once https://github.com/Microsoft/TypeScript/issues/1213 is closed
export interface ResponseTransformMap<Query extends BasePatreonQuery> {
    default: (res: GetResponsePayload<Query>) => GetResponsePayload<Query>
    simplified: (res: GetResponsePayload<Query>) => ReturnType<typeof simplifyFromQuery<Query>>
    normalized: (res: GetResponsePayload<Query>) => ReturnType<typeof normalizeFromQuery<Query>>
}

/** @deprecated */
export type GetResponseMap<Query extends BasePatreonQuery> = ResponseTransformMap<Query>

export type ResponseTransformType = keyof GetResponseMap<BasePatreonQuery>

class GenericPatreonClientMethods<TransformType extends ResponseTransformType, IncludeAll extends boolean> {
    public constructor (
        protected _oauth: PatreonOauthClient,
        protected transformType: TransformType,
        private parser: ResponseTransformMap<BasePatreonQuery>[TransformType],
        protected _include_all_query: IncludeAll,
        private _token?: StoredToken,
    ) {}

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
     * @throws on failed request
     */
    public async fetchOauth2<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions | undefined
    ) {
        if (this._token) {
            options ??= {}
            options.token ??= this._token
        }

        return await this._oauth.fetch(path, query, options)
            .then(res => this._replace<Query>(res))
    }

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
    ) {
        if (this._token) {
            options ??= {}
            options.token ??= this._token
        }

        const paginator = this._oauth.paginate(path, query, options)

        let page = await paginator.next()
        while (!page.done) {
            yield this._replace(page.value)
            page = await paginator.next()
        }

        return page.value
    }

    public async fetchCampaigns <
        Query extends BasePatreonQueryType<Type.Campaign, true> = QueryDefault<IncludeAll, Type.Campaign, true>
    >(
        // @ts-expect-error Nothing is wrong?
        query?: Query = this.getDefault(QueryBuilder.campaigns),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.campaigns(), query, options)
    }

    public async fetchCampaign <
        Query extends BasePatreonQueryType<Type.Campaign, false> = QueryDefault<IncludeAll, Type.Campaign, false>
    >(
        campaignId: string,
        // @ts-expect-error Nothing is wrong?
        query?: Query = this.getDefault(QueryBuilder.campaign),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.campaign(campaignId), query, options)
    }

    public async fetchCampaignMembers <
        Query extends BasePatreonQueryType<Type.Member, true> = QueryDefault<IncludeAll, Type.Member, true>
    >(
        campaignId: string,
        // @ts-expect-error Nothing is wrong?
        query?: Query = this.getDefault(QueryBuilder.member),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.campaignMembers(campaignId), query, options)
    }

    public async fetchCampaignPosts <
        Query extends BasePatreonQueryType<Type.Post, true> = QueryDefault<IncludeAll, Type.Post, true>
    >(
        campaignId: string,
        // @ts-expect-error Nothing is wrong?
        query?: Query = this.getDefault(QueryBuilder.campaignPosts),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.campaignPosts(campaignId), query, options)
    }

    public async fetchMember <
        Query extends BasePatreonQueryType<Type.Member, false> = QueryDefault<IncludeAll, Type.Member, false>
    >(
        memberId: string,
        // @ts-expect-error Nothing is wrong?
        query?: Query = this.getDefault(QueryBuilder.member),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.member(memberId), query, options)
    }

    public async fetchPost <
        Query extends BasePatreonQueryType<Type.Post, false> = QueryDefault<IncludeAll, Type.Post, false>
    >(
        postId: string,
        // @ts-expect-error Nothing is wrong?
        query?: Query = this.getDefault(QueryBuilder.post),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.post(postId), query, options)
    }

    public async fetchIdentity <
        Query extends BasePatreonQueryType<Type.User, false> = QueryDefault<IncludeAll, Type.User, false>
    >(
        // @ts-expect-error Nothing is wrong?
        query?: Query = this.getDefault(QueryBuilder.identity),
        options?: Oauth2RouteOptions
    ) {
        return await this.fetchOauth2<Query>(Routes.identity(), query, options)
    }

    public paginateCampaigns <
        Query extends BasePatreonQueryType<Type.Campaign, true> = QueryDefault<IncludeAll, Type.Campaign, true>
    >(
        // @ts-expect-error Nothing is wrong?
        query?: Query = this.getDefault(QueryBuilder.campaigns),
        options?: Oauth2RouteOptions
    ) {
        return this.paginateOauth2<Query>(Routes.campaigns(), query, options)
    }

    public paginateCampaignMembers <
        Query extends BasePatreonQueryType<Type.Member, true> = QueryDefault<IncludeAll, Type.Member, true>
    >(
        campaignId: string,
        // @ts-expect-error Nothing is wrong?
        query?: Query = this.getDefault(QueryBuilder.campaignMembers),
        options?: Oauth2RouteOptions
    ) {
        return this.paginateOauth2<Query>(Routes.campaignMembers(campaignId), query, options)
    }

    public paginateCampaignPosts <
        Query extends BasePatreonQueryType<Type.Post, true> = QueryDefault<IncludeAll, Type.Post, true>
    >(
        campaignId: string,
        // @ts-expect-error Nothing is wrong?
        query?: Query = this.getDefault(QueryBuilder.campaignPosts),
        options?: Oauth2RouteOptions
    ) {
        return this.paginateOauth2<Query>(Routes.campaignPosts(campaignId), query, options)
    }

    /** @deprecated */
    public listOauth2: GenericPatreonClientMethods<TransformType, IncludeAll>['paginateOauth2'] = (...args) => this.paginateOauth2(...args)
    /** @deprecated */
    public listCampaignPosts: GenericPatreonClientMethods<TransformType, IncludeAll>['paginateCampaignPosts'] = (...args) => this.paginateCampaignPosts(...args)
    /** @deprecated */
    public listCampaignMembers: GenericPatreonClientMethods<TransformType, IncludeAll>['paginateCampaignMembers'] = (...args) => this.paginateCampaignMembers(...args)
    /** @deprecated */
    public listCampaigns: GenericPatreonClientMethods<TransformType, IncludeAll>['paginateCampaigns'] = (...args) => this.paginateCampaigns(...args)
}

export abstract class PatreonClientMethods<IncludeAll extends boolean> extends GenericPatreonClientMethods<'default', IncludeAll> {
    public oauth: PatreonOauthClient

    public simplified: GenericPatreonClientMethods<'simplified', IncludeAll>

    public normalized: GenericPatreonClientMethods<'normalized', IncludeAll>

    /**
     * The application name of the client.
     * @default null
     */
    public name: string | null = null

    public constructor (
        protected rawOauthOptions: PatreonOauthClientOptions,
        rest: Partial<RESTOptions<IncludeAll>> = {},
        name: string | null,
        _token?: StoredToken,
    ) {
        const restClient = new RestClient(rest)
        restClient.name = name

        const oauth = new PatreonOauthClient(rawOauthOptions, restClient)
        const includeAllQueries = rest.includeAllQueries ?? <IncludeAll>false

        super(oauth, 'default', (res) => res, includeAllQueries,  _token)

        this.name = name
        this.oauth = oauth

        this.normalized = new GenericPatreonClientMethods(oauth, 'normalized', normalizeFromQuery, includeAllQueries, _token)
        this.simplified = new GenericPatreonClientMethods(oauth, 'simplified', simplifyFromQuery, includeAllQueries, _token)
    }

    public static hasAllQueriesEnabled <
        Client extends PatreonClientMethods<boolean>
    >(client: Client): client is Client & PatreonClientMethods<true> {
        return client._include_all_query
    }

    public static createCustomParser <
        Type extends keyof ResponseTransformMap<BasePatreonQuery>,
        IncludeAll extends boolean = boolean
    >(
        client: PatreonClientMethods<IncludeAll>,
        type: Type,
        parser: ResponseTransformMap<BasePatreonQuery>[Type],
        includeAllQueries: IncludeAll
    ) {
        return new GenericPatreonClientMethods(client.oauth, type, parser, includeAllQueries, client['_token'])
    }
}

/** @deprecated */
export class BasePatreonClientMethods extends PatreonClientMethods<boolean> {}
