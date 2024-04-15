import type { BasePatreonQuery, BasePatreonQueryType, GetResponsePayload } from '../query'
import { Type } from '../../../schemas/v2'

import {
    PatreonOauthClient,
    type StoredToken,
} from '../oauth2/client'

import { Oauth2Routes } from '../oauth2/routes'

/**
 * Options for the raw Oauth2 request methods
 */
export interface Oauth2FetchOptions {
    /**
     * If an request is missing access on, try to refresh the access token and retry the same request.
     * @default false
     */
    retryOnFailed?: boolean

    /**
     * @deprecated use {@link Oauth2FetchOptions.retryOnFailed}
     */
    refreshOnFailed?: boolean

    /**
     * Overwrite the client token with a new token
     * @default undefined
     */
    token?: StoredToken

    /**
     * Overwrite the method of the request.
     * If you are using a function to write, update or delete resources this will be already set.
     * @default 'GET'
     */
    method?: string

    /**
     * The stringified body to use in the request, if the endpoint allows a body.
     * @default undefined
     */
    body?: string

    /**
     * Overwrite the `'Content-Type'` header
     * @default 'application/json'
     */
    contentType?: string
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
    ): AsyncGenerator<GetResponsePayload<Query>, void>
}

export class BasePatreonClientMethods implements OauthClient {
    public constructor (
        public oauth: PatreonOauthClient,
        private _token?: StoredToken,
    ) {}

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

        return await PatreonOauthClient.fetch<Query>(path, query, this.oauth, options)
    }

    public listOauth2<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions | undefined
    ): AsyncGenerator<GetResponsePayload<Query>, void, unknown> {
        if (this._token) {
            options ??= {}
            options.token ??= this._token
        }

        return PatreonOauthClient.paginate(path, query, this.oauth, options)
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
