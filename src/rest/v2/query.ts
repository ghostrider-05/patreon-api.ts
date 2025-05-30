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

export const buildQuery = QueryBuilder.legacyBuilder
