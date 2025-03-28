/* eslint-disable jsdoc/require-jsdoc */
// #region method-simplify
import { simplify, PatreonCreatorClient, QueryBuilder } from 'patreon-api.ts'

declare const client: PatreonCreatorClient

const campaignQuery = QueryBuilder.campaign
    .addRelationships(['creator'])
    .setAttributes({ campaign: ['created_at'], user: ['full_name'] })

const rawCampaign = await client.fetchCampaign('campaign_id', campaignQuery)

const simplified = simplify(rawCampaign)
console.log(`Campaign by ${simplified.creator.fullName} created at ${simplified.createdAt}`)

const postsQuery = QueryBuilder.campaignPosts
    .addRelationships(['campaign'])
    .setAttributes({ campaign: ['created_at'], post: ['is_paid', 'title']  })

const campaignPosts = await client.fetchCampaignPosts('campaign_id', postsQuery)

const posts = simplify(campaignPosts)
for (const post of posts.data) {
    console.log(`Post ${post.title} is paid: ${post.isPaid}`)
}
// #endregion method-simplify
// #region method-normalize
import { normalize, PatreonCreatorClient, QueryBuilder } from 'patreon-api.ts'

declare const client: PatreonCreatorClient

const campaignQuery = QueryBuilder.campaign
    .addRelationships(['creator'])
    .setAttributes({ campaign: ['created_at'], user: ['full_name'] })

const rawCampaign = await client.fetchCampaign('campaign_id', campaignQuery)

const normalized = normalize(rawCampaign)
console.log(`Campaign by ${normalized.creator.full_name} created at ${normalized.created_at}`)

const postsQuery = QueryBuilder.campaignPosts
    .addRelationships(['campaign'])
    .setAttributes({ campaign: ['created_at'], post: ['is_paid', 'title']  })

const campaignPosts = await client.fetchCampaignPosts('campaign_id', postsQuery)

const posts = normalize(campaignPosts)
for (const post of posts.data) {
    console.log(`Post ${post.title} is paid: ${post.is_paid}`)
}
// #endregion method-normalize
// #region method-query
import {
    type PatreonClient,
    QueryBuilder,
    Routes,
    Type,
    type PatreonQuery,
    simplifyFromQuery,
} from 'patreon-api.ts'

export async function fetchPatreonRaw (client: PatreonClient) {
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

    const simplified = simplifyFromQuery<Query>(campaigns)
}
// #endregion method-query