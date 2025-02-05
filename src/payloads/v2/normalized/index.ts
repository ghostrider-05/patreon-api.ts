import type { BasePatreonQuery, GetResponsePayload } from '../../../rest/v2/'
import type { RelationshipFields, RelationshipMap, Type } from '../../../schemas/v2/'
import type { RequestPayload } from '../internals/request'

import { type AnyToCamelCase, convertToCamelcase } from './capitalize'
import { findRelationships } from './find'

import type {
    GetNormalizedResponsePayload,
    NormalizedGetRequestPayload,
    NormalizedListRequestPayload,
    NormalizedRequestPayload,
    NormalizeRequest,
} from './payload'

/**
 * Returns if the payload has pagination data
 * @param payload The payload to check
 * @returns the result
 */
export function isListingPayload <
    T extends Type,
    Includes extends RelationshipFields<T> = never,
    Attributes extends RelationshipMap<T, Includes> = never,
>(payload: RequestPayload<T, Includes, Attributes, boolean>): payload is RequestPayload<T, Includes, Attributes, true> {
    return 'meta' in payload ? payload.meta.pagination != undefined : false
}

/**
 * Returns if the normalized payload has pagination data
 * @param payload The payload to check
 * @returns the result
 */
export function isListingNormalizedPayload<
    T extends Type,
    Includes extends RelationshipFields<T> = never,
    Attributes extends RelationshipMap<T, Includes> = never,
>(payload: NormalizedRequestPayload<T, Includes, Attributes, boolean>): payload is NormalizedListRequestPayload<T, Includes, Attributes> {
    return 'pagination' in payload ? payload.pagination != undefined : false
}

/**
 * EXPERIMENTAL Issue a bug if something is broken
 * @param payload The raw payload from the API
 * @returns the normalized response, with no key changes
 */
export function normalize <
    T extends Type,
    Includes extends RelationshipFields<T>,
    Attributes extends RelationshipMap<T, Includes>,
    Listing extends boolean,
    Request extends RequestPayload<T, Includes, Attributes, Listing>
>(payload: Request): NormalizeRequest<Request> {
    if (Array.isArray(payload.data)) {
        const { pagination } = (payload as RequestPayload<T, Includes, Attributes, true>).meta

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
                total: pagination.total,
                next_cursor: pagination.cursors?.next ?? null,
            },
        }

        return normalized as NormalizeRequest<Request>
    } else {
        const { links } = (payload as RequestPayload<T, Includes, Attributes, false>)
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
            link: links.self,
        }

        return normalized as NormalizeRequest<Request>
    }
}

/**
 * EXPERIMENTAL Issue a bug if something is broken
 * @param payload The raw payload from the API
 * @returns the normalized response, with no key changes
 */
export function normalizeFromQuery<
    Query extends BasePatreonQuery
>(payload: GetResponsePayload<Query>): GetNormalizedResponsePayload<Query> {
    // @ts-expect-error ??????????
    return normalize(payload) as GetNormalizedResponsePayload<Query>
}

/**
 * EXPERIMENTAL Issue a bug if something is broken
 * @param payload The raw payload from the API
 * @returns the normalized response, with keys converted to camel case
 */
export function simplify<
    T extends Type,
    Includes extends RelationshipFields<T>,
    Attributes extends RelationshipMap<T, Includes>,
    Listing extends boolean,
    Request extends RequestPayload<T, Includes, Attributes, Listing>
>(payload: Request): AnyToCamelCase<NormalizeRequest<Request>> {
    return convertToCamelcase(normalize(payload))
}

/**
 * EXPERIMENTAL Issue a bug if something is broken
 * @param payload The raw payload from the API
 * @returns the normalized response, with keys converted to camel case
 */
export function simplifyFromQuery<Query extends BasePatreonQuery>(payload: GetResponsePayload<Query>): AnyToCamelCase<GetNormalizedResponsePayload<Query>> {
    return convertToCamelcase(normalizeFromQuery(payload))
}
