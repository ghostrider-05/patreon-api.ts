import { RequestPayload } from '../../payloads/v2/internals/request'

import { Type, RelationshipFields, RelationshipMap } from '../../schemas/v2'

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

type ValueOrArray<T> = T | T[]

type PaginationQuerySort =
    | string
    | { key: string, descending?: boolean }

export type PaginationQuery = {
    cursor?: string
    count?: number
    sort?: ValueOrArray<PaginationQuerySort>
}

export interface QueryRequestOptions extends PaginationQuery {
    // TODO: see if this also applies to V2
    /**
     * @experimental This is documented to both versions, but makes more sense to work for only V1
     * @see https://docs.patreon.com/#requesting-specific-data
     */
    useDefaultIncludes?: boolean
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
     * @private
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

function resolveSortOptions(options: ValueOrArray<PaginationQuerySort>): string {
    return (Array.isArray(options) ? options : [options])
        .map(option => {
            return typeof option === 'string'
                ? option
                : (option.descending ? `-${option.key}` : option.key)
        })
        .join(',')
}

function resolveQueryOptions(options?: QueryRequestOptions): Record<string, string> {
    const params: Record<string, string> = {}

    if (options?.count != undefined) params['page[count]'] = options.count.toString()
    if (options?.cursor != undefined) params['page[cursor]'] = options.cursor
    if (options?.sort != undefined) params['sort'] = resolveSortOptions(options.sort)

    if (options?.useDefaultIncludes != undefined) {
        params['json-api-use-default-includes'] = `${options.useDefaultIncludes}`
    }

    return params
}

export function createQuery<Q extends BasePatreonQueryType<Type, boolean>>(params: URLSearchParams): Q {
    function toQuery(params: URLSearchParams): string {
        return params.size > 0 ? '?' + params.toString() : ''
    }

    return {
        params,
        query: toQuery(params),
        // @ts-expect-error expect
        _payload_type: <Q['_payload_type']>'',
    } as Q
}

function _buildQuery<
    T extends Extract<
        Type,
        | Type.Campaign
        | Type.Member
        | Type.Post
        | Type.User
    >,
    Listing extends boolean = false
>() {
    return function <Includes extends RelationshipFields<`${T}`> = never>(include?: Includes[]) {
        return function <
            Attributes extends RelationshipMap<T, Includes>,
        >(attributes?: Attributes, options?: QueryRequestOptions): PatreonQuery<T, Includes, Attributes, Listing> {
            const params = new URLSearchParams({
                ...(include ? { include: include.join(',') } : {}),
                ...Object
                    .keys(attributes ?? {})
                    .reduce((params, key) => ({ ...params, [`fields[${key}]`]: attributes![key].join(',') }), {}),
                ...resolveQueryOptions(options),
            })

            return createQuery(params)
        }
    }
}

export const buildQuery = {
    identity: _buildQuery<Type.User, false>(),
    campaign: _buildQuery<Type.Campaign, false>(),
    campaigns: _buildQuery<Type.Campaign, true>(),
    campaignMembers: _buildQuery<Type.Member, true>(),
    member: _buildQuery<Type.Member, false>(),
    campaignPosts: _buildQuery<Type.Post, true>(),
    post: _buildQuery<Type.Post, false>(),
}
