import { RequestPayload } from '../../payloads/v2/internals/request'

import { Type, RelationshipFields, RelationshipMap } from '../../schemas/v2'

export type BasePatreonQuery = {
    /**
     * The actual encoded query string.
     * @example `'?fields%5Buser%5D=url%2Cname'`
     */
    query: string
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

function _buildQuery<
    T extends Extract<
        Type,
        | Type.Campaign
        | Type.Member
        | Type.Post
        | Type.User
    >,
    Listing extends boolean = false
> () {
    return function <Includes extends RelationshipFields<`${T}`> = never> (include?: Includes[]) {
        return function <
            Attributes extends RelationshipMap<T, Includes>,
        > (attributes?: Attributes): PatreonQuery<T, Includes, Attributes, Listing> {
            const params = new URLSearchParams({
                ...(include ? { include: include.join(',') } : { }),
                ...Object
                    .keys(attributes ?? {})
                    .reduce((params, key) => ({ ...params, [`fields[${key}]`]: attributes![key].join(',') }), {})
            }).toString()

            return {
                query: params.length > 0 ? '?' + params : '',
                // @ts-expect-error expected
                _payload_type: '',
            }
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
