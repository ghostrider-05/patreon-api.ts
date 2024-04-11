import type { BasePatreonQuery, BasePatreonQueryType, GetResponsePayload } from '../query'
import { Type } from '../../../schemas/v2'

import {
    PatreonOauthClient,
    type Token,
    type StoredToken,
    type BaseOauthClientOptions,
} from '../oauth2/client'

import { Oauth2Routes } from '../oauth2/routes'
import { type Fetch, type PatreonTokenFetchOptions } from '../oauth2/store'

export type {
    Token,
    StoredToken,
}

export interface PatreonClientOptions extends BaseOauthClientOptions {
    name?: string
    store?: PatreonTokenFetchOptions
    refreshOnFailed?: boolean
    fetch?: Fetch
    token?: Token
}

export type PatreonInitializeClientOptions = PatreonClientOptions & Required<Pick<PatreonClientOptions, 'store'>>

export interface Oauth2FetchOptions {
    refreshOnFailed?: boolean
    token?: StoredToken
    method?: string
    contentType?: string
}

export type Oauth2RouteOptions = Omit<Oauth2FetchOptions, 'method'>

interface OauthClient {
    fetchOauth2<Query extends BasePatreonQuery>(
        path: string,
        query: Query,
        options?: Oauth2FetchOptions,
    ): Promise<GetResponsePayload<Query> | undefined>
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
}
