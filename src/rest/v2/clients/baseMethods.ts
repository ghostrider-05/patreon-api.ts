import type { BasePatreonQuery, BasePatreonQueryType, GetResponsePayload } from '../query'
import { Type } from '../../../schemas/v2'

import {
    CreatorToken,
    PatreonOauthClient,
    type PatreonOauthClientOptions,
    type StoredToken,
} from '../oauth2/client'

import { Oauth2Routes } from '../oauth2/routes'
import { RequestMethod, RequestOptions, RestClient, type RESTOptions } from '../oauth2/rest'

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

interface OauthClient {
    fetchOauth2<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions,
    ): Promise<GetResponsePayload<Query> | undefined>

    listOauth2<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions,
    ): AsyncGenerator<GetResponsePayload<Query>, number>
}

export abstract class PatreonClientMethods implements OauthClient {
    public oauth: PatreonOauthClient
    protected rest: RestClient

    public constructor (
        protected rawOauthOptions: PatreonOauthClientOptions,
        rest: Partial<RESTOptions> = {},
        private _token?: StoredToken,
    ) {
        this.rest = new RestClient(rest)
        this.oauth = new PatreonOauthClient(rawOauthOptions, this.rest)
    }

    /**
     * Fetch the Patreon Oauth V2 API
     * @param path The Oauth V2 API Route
     * @param query The query builder with included fields and attributes
     * @param options Request options
     * @returns the response for succesful requests, otherwise undefined.
     */
    public async fetchOauth2<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions | undefined
    ): Promise<GetResponsePayload<Query> | undefined> {
        if (this._token) {
            options ??= {}
            options.token ??= this._token
        }

        return await this.oauth.fetch<Query>(path, query, options)
    }

    public listOauth2<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions | undefined
    ): AsyncGenerator<GetResponsePayload<Query>, number, unknown> {
        if (this._token) {
            options ??= {}
            options.token ??= this._token
        }

        return this.oauth.paginate(path, query, options)
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

    public listCampaigns <Query extends BasePatreonQueryType<Type.Campaign, true>>(query: Query, options?: Oauth2RouteOptions) {
        return this.listOauth2<Query>(Oauth2Routes.campaigns(), query, options)
    }

    public listCampaignMembers <Query extends BasePatreonQueryType<Type.Member, true>>(campaignId: string, query: Query, options?: Oauth2RouteOptions) {
        return this.listOauth2<Query>(Oauth2Routes.campaignMembers(campaignId), query, options)
    }

    public listCampaignPosts <Query extends BasePatreonQueryType<Type.Post, true>>(campaignId: string, query: Query, options?: Oauth2RouteOptions) {
        return this.listOauth2<Query>(Oauth2Routes.campaignPosts(campaignId), query, options)
    }
}

/** @deprecated */
export class BasePatreonClientMethods extends PatreonClientMethods {}
