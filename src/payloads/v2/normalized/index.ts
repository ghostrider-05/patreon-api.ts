import { AnyToCamelCase, convertToCamelcase } from './capitalize'
import { findRelationships } from './find'

import type { RelationshipFields, RelationshipMap, Type } from '../../../schemas/v2/'
import type { RequestPayload } from '../internals/request'

import type {
    GetNormalizedResponsePayload,
    NormalizedGetRequestPayload,
    NormalizedListRequestPayload,
    NormalizedRequestPayload,
} from './payload'
import { BasePatreonQuery, GetResponsePayload } from '../../../v2'

/**
 *
 * @param payload
 */
export function isListingPayload <
    T extends Type,
    Includes extends RelationshipFields<T> = never,
    Attributes extends RelationshipMap<T, Includes> = never,
>(payload: RequestPayload<T, Includes, Attributes, boolean>): payload is RequestPayload<T, Includes, Attributes, true> {
    return 'meta' in payload ? payload.meta.pagination != undefined : false
}

/**
 *
 * @param payload
 */
export function isListingNormalizedPayload<
    T extends Type,
    Includes extends RelationshipFields<T> = never,
    Attributes extends RelationshipMap<T, Includes> = never,
>(payload: NormalizedRequestPayload<T, Includes, Attributes>): payload is NormalizedListRequestPayload<T, Includes, Attributes> {
    return 'pagination' in payload ? payload.pagination != undefined : false
}

/**
 *
 * @param payload
 */
export function normalize <
    T extends Type,
    Includes extends RelationshipFields<T> = never,
    Attributes extends RelationshipMap<T, Includes> = never,
>(payload: RequestPayload<T, Includes, Attributes, boolean>): NormalizedRequestPayload<T, Includes, Attributes> {
    if (isListingPayload(payload)) {
        const normalized: NormalizedListRequestPayload<Type, Includes, Attributes> = {
            data: payload.data.map(item => {
                const relationships = findRelationships<T, Includes, Attributes>(
                    item.type,
                    // TODO: figure out why type is unknown
                    'relationships' in item ? <never>item.relationships : undefined,
                    'included' in payload ? <never>payload.included : undefined,
                )

                return {
                    ...item.attributes,
                    ...relationships,
                    id: item.id,
                    type: item.type,
                }
            }),
            pagination: {
                total: payload.meta.pagination.total,
                next_cursor: payload.meta.pagination.cursors?.next ?? null,
            },
        }

        return normalized as NormalizedRequestPayload<T, Includes, Attributes>
    } else {
        const relationships = findRelationships<T, Includes, Attributes>(
            payload.data.type,
            // TODO: figure out why type is unknown
            'relationships' in payload.data ? <never>payload.data.relationships : undefined,
            'included' in payload ? <never>payload.included : undefined,
        )

        const normalized: NormalizedGetRequestPayload<Type, Includes, Attributes> = {
            ...payload.data.attributes,
            ...relationships,
            id: payload.data.id,
            type: payload.data.type,
            link: payload.links.self,
        }

        return normalized as NormalizedRequestPayload<T, Includes, Attributes>
    }
}

/**
 *
 * @param payload
 */
export function normalizeFromQuery<
    Query extends BasePatreonQuery
>(payload: GetResponsePayload<Query>): GetNormalizedResponsePayload<Query> {
    return normalize(payload) as GetNormalizedResponsePayload<Query>
}

/**
 *
 * @param payload
 */
export function simplify<
    T extends Type,
    Includes extends RelationshipFields<T> = never,
    Attributes extends RelationshipMap<T, Includes> = never,
>(payload: RequestPayload<T, Includes, Attributes, boolean>): AnyToCamelCase<NormalizedRequestPayload<T, Includes, Attributes>> {
    return convertToCamelcase(normalize(payload))
}

/**
 *
 * @param payload
 */
export function simplifyFromQuery<Query extends BasePatreonQuery>(payload: GetResponsePayload<Query>): AnyToCamelCase<GetNormalizedResponsePayload<Query>> {
    return convertToCamelcase(normalizeFromQuery(payload))
}
