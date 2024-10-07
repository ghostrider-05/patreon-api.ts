import {
    buildQuery,
    Type,
    type PatreonClient,
    type GetResponsePayload,
    type PatreonQuery,
    type QueryRequestOptions,
    type RelationshipMap,
} from 'patreon-api.ts'

/**
 *
 * @param client
 * @param options
 * @param options.token
 * @param options.attributes
 * @param options.query
 */
export async function fetchOauthMemberships <Attributes extends RelationshipMap<Type.User, 'campaign' | 'memberships'>>(
    client: PatreonClient,
    options: {
        token: string
        attributes?: Attributes
        query?: QueryRequestOptions
    }
): Promise<GetResponsePayload<PatreonQuery<Type.User, 'memberships' | 'campaign', Attributes>>> {
    const query = buildQuery.identity(['memberships', 'campaign'])(options.attributes, options.query)

    return await client.fetchIdentity(query, {
        token: options.token,
    })
}
