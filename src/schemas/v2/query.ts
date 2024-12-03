import {
    type BasePatreonQuery,
    buildQuery,
    type QueryRequestOptions,
} from '../../rest/v2/query'

import type {
    RelationshipFields,
    RelationshipMap,
} from './relationships'

import * as SchemaResourcesData from './generated/schemas'

import { Type } from './item'

// eslint-disable-next-line jsdoc/require-jsdoc
function getResource <T extends Type>(t: T) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Object.values(SchemaResourcesData).find(d => d.resource === t)! as (
        typeof SchemaResourcesData[keyof typeof SchemaResourcesData] extends infer D
            ? D extends typeof SchemaResourcesData[keyof typeof SchemaResourcesData]
                ? D['resource'] extends T
                    ? D
                    : never
                : never
            : never
    )
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function createCompleteQueryOptions <
    T extends Type
>(t: T) {
    const data = getResource(t)
    const { properties, relationships, resource } = data

    return {
        include: data.relationships.map(n => n.name) as RelationshipFields<T>[],
        attributes: {
            [resource]: properties,
            ...relationships.reduce((obj, n) => ({
                ...obj,
                [n.resource]: Object.values(SchemaResourcesData).find(d => d.resource === n.resource)?.properties ?? [],
            }), {})
        } as RelationshipMap<T, RelationshipFields<T>>
    }
}

export const buildCompleteQuery = {
    campaign: (options?: QueryRequestOptions) => {
        const { attributes, include } = createCompleteQueryOptions(Type.Campaign)
        return buildQuery.campaign(include)(attributes, options)
    },
    campaignMembers: (options?: QueryRequestOptions) => {
        const { attributes, include } = createCompleteQueryOptions(Type.Member)
        return buildQuery.campaignMembers(include)(attributes, options)
    },
    campaignPosts: (options?: QueryRequestOptions) => {
        const { attributes, include } = createCompleteQueryOptions(Type.Post)
        return buildQuery.campaignPosts(include)(attributes, options)
    },
    campaigns: (options?: QueryRequestOptions) => {
        const { attributes, include } = createCompleteQueryOptions(Type.Campaign)
        return buildQuery.campaigns(include)(attributes, options)
    },
    identity: (options?: QueryRequestOptions) => {
        const { attributes, include } = createCompleteQueryOptions(Type.User)
        return buildQuery.identity(include)(attributes, options)
    },
    member: (options?: QueryRequestOptions) => {
        const { attributes, include } = createCompleteQueryOptions(Type.Member)
        return buildQuery.member(include)(attributes, options)
    },
    post: (options?: QueryRequestOptions) => {
        const { attributes, include } = createCompleteQueryOptions(Type.Post)
        return buildQuery.post(include)(attributes, options)
    },
    webhooks: (options?: QueryRequestOptions) => {
        const { attributes, include } = createCompleteQueryOptions(Type.Webhook)
        return buildQuery.webhooks(include)(attributes, options)
    },
} satisfies Record<keyof typeof buildQuery, (options?: QueryRequestOptions) => BasePatreonQuery>
