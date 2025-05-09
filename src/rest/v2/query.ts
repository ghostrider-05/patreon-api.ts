import type { RequestPayload } from '../../payloads/v2/internals/request'

import { type Type, type RelationshipFields, type RelationshipMap, QueryBuilder } from '../../schemas/v2'

export type BasePatreonQuery = {
    /**
     * The actual encoded query string.
     * @example `'?fields%5Buser%5D=url%2Cname'`
     */
    query: string

    /**
     * The raw search params.
     * Use {@link BasePatreonQuery.query} for the stringified params.
     */
    params: URLSearchParams
}

export type PatreonQuery<
    T extends Type,
    Includes extends RelationshipFields<T>,
    Attributes extends RelationshipMap<T, Includes>,
    Listing extends boolean = false
> = BasePatreonQuery & {
    /**
     * DO NOT USE THIS!
     *
     * An empty string.
     * Used to infer the return type for the response
     * @deprecated
     */
    _payload_type: RequestPayload<T, Includes, Attributes, Listing>
}

export type BasePatreonQueryType<T extends Type, Listing extends boolean> = PatreonQuery<T, never, never, Listing>

type PayloadFromQuery<
    T extends Type,
    Include extends RelationshipFields<`${T}`>,
    Attributes extends RelationshipMap<T, Include>,
    Listing extends boolean,
    Query extends PatreonQuery<T, Include, Attributes, Listing>
> = Query['_payload_type']

export type GetResponsePayload<Query extends BasePatreonQuery> = Query extends PatreonQuery<infer T, infer I, infer A, infer L>
    ? PayloadFromQuery<T, I, A, L, Query>
    : never

/**
 * Helper function to create a Patreon query from URLSearchParams
 * @param params the parameters for the request.
 * @returns the Patreon query to pass to client methods
 * @deprecated use `QueryBuilder.fromParams<Q>()` instead
 */
export function createQuery<Q extends BasePatreonQueryType<Type, boolean>>(params: URLSearchParams): Q {
    return QueryBuilder.fromParams<Q>(params)
}

export const buildQuery = {
    identity: QueryBuilder.createFunctionBuilder(QueryBuilder.identity),
    campaign: QueryBuilder.createFunctionBuilder(QueryBuilder.campaign),
    campaigns: QueryBuilder.createFunctionBuilder(QueryBuilder.campaigns),
    campaignMembers: QueryBuilder.createFunctionBuilder(QueryBuilder.campaignMembers),
    member: QueryBuilder.createFunctionBuilder(QueryBuilder.member),
    campaignPosts: QueryBuilder.createFunctionBuilder(QueryBuilder.campaignPosts),
    post: QueryBuilder.createFunctionBuilder(QueryBuilder.post),
    webhooks: QueryBuilder.createFunctionBuilder(QueryBuilder.webhooks),
}
