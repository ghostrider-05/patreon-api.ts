import type { BasePatreonQuery, BasePatreonQueryType, GetResponsePayload } from '../query'
import type { Type } from '../../../schemas/v2'

import {
    CreatorToken,
    PatreonOauthClient,
    type PatreonOauthClientOptions,
    type StoredToken,
} from '../oauth2/client'

import { Oauth2Routes } from '../oauth2/routes'
import { RequestMethod, RequestOptions, RestClient, type RESTOptions } from '../oauth2/rest'
import { normalizeFromQuery, simplifyFromQuery } from '../../../v2'

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
interface GetResponseMap<Query extends BasePatreonQuery> {
    default: (res: GetResponsePayload<Query>) => GetResponsePayload<Query>
    simplified: (res: GetResponsePayload<Query>) => ReturnType<typeof simplifyFromQuery<Query>>
    normalized: (res: GetResponsePayload<Query>) => ReturnType<typeof normalizeFromQuery<Query>>
}

export type ResponseTransformType = keyof GetResponseMap<BasePatreonQuery>

class GenericPatreonClientMethods<TransformType extends ResponseTransformType> {
    public constructor (
        protected _oauth: PatreonOauthClient,
        private _replacer: TransformType,
        private _token?: StoredToken,
    ) {}

    private _replace <Query extends BasePatreonQuery> (res: GetResponsePayload<Query>): ReturnType<GetResponseMap<Query>[TransformType]> {
        const map: GetResponseMap<Query> = {
            default: (res) => res,
            simplified: (res) => simplifyFromQuery(res),
            normalized: (res) => normalizeFromQuery(res),
        }

        const replacer = map[this._replacer]
        return replacer(res) as ReturnType<typeof replacer>
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

    public async fetchCampaigns <Query extends BasePatreonQueryType<Type.Campaign, true>>(query: Query, options?: Oauth2RouteOptions) {
        return await this.fetchOauth2<Query>(Oauth2Routes.campaigns(), query, options)
    }

    public async fetchCampaign <Query extends BasePatreonQueryType<Type.Campaign, false>>(campaignId: string, query: Query, options?: Oauth2RouteOptions) {
        return await this.fetchOauth2<Query>(Oauth2Routes.campaign(campaignId), query, options)
    }

    public async fetchCampaignMembers <Query extends BasePatreonQueryType<Type.Member, true>>(campaignId: string, query: Query, options?: Oauth2RouteOptions) {
        return await this.fetchOauth2<Query>(Oauth2Routes.campaignMembers(campaignId), query, options)
    }

    public async fetchCampaignPosts <Query extends BasePatreonQueryType<Type.Post, true>>(campaignId: string, query: Query, options?: Oauth2RouteOptions) {
        return await this.fetchOauth2<Query>(Oauth2Routes.campaignPosts(campaignId), query, options)
    }

    public async fetchMember <Query extends BasePatreonQueryType<Type.Member, false>>(memberId: string, query: Query, options?: Oauth2RouteOptions) {
        return await this.fetchOauth2<Query>(Oauth2Routes.member(memberId), query, options)
    }

    public async fetchPost <Query extends BasePatreonQueryType<Type.Post, false>>(postId: string, query: Query, options?: Oauth2RouteOptions) {
        return await this.fetchOauth2<Query>(Oauth2Routes.post(postId), query, options)
    }

    public async fetchIdentity <Query extends BasePatreonQueryType<Type.User, false>>(query: Query, options?: Oauth2RouteOptions) {
        return await this.fetchOauth2<Query>(Oauth2Routes.identity(), query, options)
    }

    public paginateCampaigns <Query extends BasePatreonQueryType<Type.Campaign, true>>(query: Query, options?: Oauth2RouteOptions) {
        return this.paginateOauth2<Query>(Oauth2Routes.campaigns(), query, options)
    }

    public paginateCampaignMembers <Query extends BasePatreonQueryType<Type.Member, true>>(campaignId: string, query: Query, options?: Oauth2RouteOptions) {
        return this.paginateOauth2<Query>(Oauth2Routes.campaignMembers(campaignId), query, options)
    }

    public paginateCampaignPosts <Query extends BasePatreonQueryType<Type.Post, true>>(campaignId: string, query: Query, options?: Oauth2RouteOptions) {
        return this.paginateOauth2<Query>(Oauth2Routes.campaignPosts(campaignId), query, options)
    }

    /** @deprecated */
    public listOauth2: GenericPatreonClientMethods<TransformType>['paginateOauth2'] = (...args) => this.paginateOauth2(...args)
    /** @deprecated */
    public listCampaignPosts: GenericPatreonClientMethods<TransformType>['paginateCampaignPosts'] = (...args) => this.paginateCampaignPosts(...args)
    /** @deprecated */
    public listCampaignMembers: GenericPatreonClientMethods<TransformType>['paginateCampaignMembers'] = (...args) => this.paginateCampaignMembers(...args)
    /** @deprecated */
    public listCampaigns: GenericPatreonClientMethods<TransformType>['paginateCampaigns'] = (...args) => this.paginateCampaigns(...args)
}


export abstract class PatreonClientMethods extends GenericPatreonClientMethods<'simplified'> {
    public oauth: PatreonOauthClient

    public api: GenericPatreonClientMethods<'default'>
    public normalized: GenericPatreonClientMethods<'normalized'>

    public constructor (
        protected rawOauthOptions: PatreonOauthClientOptions,
        rest: Partial<RESTOptions> = {},
        _token?: StoredToken,
    ) {
        const restClient = new RestClient(rest)
        const oauth = new PatreonOauthClient(rawOauthOptions, restClient)

        super(oauth, 'simplified', _token)

        this.oauth = oauth

        this.normalized = new GenericPatreonClientMethods(oauth, 'normalized', _token)
        this.api = new GenericPatreonClientMethods(oauth, 'default', _token)
    }
}

/** @deprecated */
export class BasePatreonClientMethods extends PatreonClientMethods {}
