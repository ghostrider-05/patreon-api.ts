import {
    buildQuery,
    type PatreonClient,
    Type,
    type GetResponsePayload,
    type PatreonQuery,
    type QueryRequestOptions,
    type RelationshipMap,
} from "patreon-api.ts";

export async function fetchOauthMemberships <Attributes extends RelationshipMap<Type.User, "campaign" | "memberships">>(
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
