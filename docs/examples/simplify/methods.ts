/* eslint-disable jsdoc/require-jsdoc */
// @ts-expect-error duplicate-imports
// #region method-simplify
import { simplify, PatreonClient, QueryBuilder } from 'patreon-api.ts'

export async function fetchSimplifiedCampaigns (
    client: PatreonClient<boolean>,
    campaignId: string,
) {
    const campaignQuery = QueryBuilder.campaign
        .addRelationships(['creator'])
        .setAttributes({ campaign: ['created_at'], user: ['full_name'] })

    const rawCampaign = await client.fetchCampaign(campaignId, campaignQuery)

    const simplified = simplify(rawCampaign)
    console.log(`Campaign by ${simplified.creator.fullName} created at ${simplified.createdAt}`)

    const postsQuery = QueryBuilder.campaignPosts
        .addRelationships(['campaign'])
        .setAttributes({ campaign: ['created_at'], post: ['is_paid', 'title']  })

    const campaignPosts = await client.fetchCampaignPosts(campaignId, postsQuery)

    const posts = simplify(campaignPosts)
    for (const post of posts.data) {
        console.log(`Post ${post.title} is paid: ${post.isPaid}`)
    }

    return posts
}
// #endregion method-simplify
// @ts-expect-error duplicate-imports
// #region method-normalize
import { normalize, PatreonClient, QueryBuilder } from 'patreon-api.ts'

export async function fetchNormalizedCampaignPosts (
    client: PatreonClient<boolean>,
    campaignId: string,
) {
    const campaignQuery = QueryBuilder.campaign
        .addRelationships(['creator'])
        // Use `setAttributes` to set the attributes of both the resource and creator relationship
        .setAttributes({ campaign: ['created_at'], user: ['full_name'] })

    const rawCampaign = await client.fetchCampaign(campaignId, campaignQuery)

    const normalized = normalize(rawCampaign)
    // Do something with the campaign here:
    console.log(`Campaign by ${normalized.creator.full_name} created at ${normalized.created_at}`)

    const postsQuery = QueryBuilder.campaignPosts
        .addRelationships(['campaign'])
        .setAttributes({ campaign: ['created_at'], post: ['is_paid', 'title']  })

    const campaignPosts = await client.fetchCampaignPosts(campaignId, postsQuery)

    const posts = normalize(campaignPosts)
    for (const post of posts.data) {
        console.log(`Post ${post.title} is paid: ${post.is_paid}`)
    }

    return posts
}
// #endregion method-normalize
// @ts-expect-error duplicate-imports
// #region method-query
import { type PatreonClient, QueryBuilder,
    Routes,
    Type,
    type PatreonQuery,
    simplifyFromQuery,
} from 'patreon-api.ts'

export async function fetchPatreonCampaigns (client: PatreonClient<boolean>) {
    type Query = PatreonQuery<Type.Campaign, 'creator', {
        user: ('full_name')[]
    }, true>

    const query = QueryBuilder.fromParams<Query>(new URLSearchParams({
        include: 'creator',
        'fields[user]': 'full_name',
    }))

    // get the campaigns
    const campaigns = await client.fetchOauth2(Routes.campaigns(), query)
    // or fetch the post(s), member(s), post(s) or current user

    return simplifyFromQuery<Query>(campaigns)
}
// #endregion method-query