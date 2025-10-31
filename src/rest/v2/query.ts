import type { Type } from '../../schemas/v2/item'
import {
    QueryBuilder,
    type BasePatreonQueryType,
} from '../../schemas/v2/query'

/**
 * Helper function to create a Patreon query from URLSearchParams
 * @param params the parameters for the request.
 * @returns the Patreon query to pass to client methods
 * @deprecated use `QueryBuilder.fromParams<Q>()` instead
 */
export function createQuery<Q extends BasePatreonQueryType<Type, boolean>>(params: URLSearchParams): Q {
    return QueryBuilder.fromParams<Q>(params)
}

/**
 * @deprecated use QueryBuilder.{property}.build instead of buildQuery.
 */
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
