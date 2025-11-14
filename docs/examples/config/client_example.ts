/* eslint-disable jsdoc/require-jsdoc */
// @ts-expect-error duplicate-imports
// #region fetch
// @errors: 2339
import { type PatreonClient, QueryBuilder } from 'patreon-api.ts'

export async function fetchPatreon (client: PatreonClient) {
    // Get the full name of the creator of the campaign
    const query = QueryBuilder.campaigns
        .addRelationships(['creator'])
        .addRelationshipAttributes('creator', ['full_name'])

    // get the campaigns
    const campaigns = await client.fetchCampaigns(query)
    // or fetch the post(s), member(s), post(s) or current user

    // Or list resources to paginate multiple pages
    for await (const campaigns of client.paginateCampaigns(query)) {
        for (const campaign of campaigns.data) {
            const creatorId = campaign.relationships.creator.data?.id
            const creator = campaigns.included.find(t => t.id === creatorId)

            console.log(`Campaign ${campaign.id} is created by ${creator?.attributes.full_name}`)
        }
    }
}
// #endregion fetch
// @ts-expect-error duplicate-imports
// #region fetch-raw
import { type PatreonClient, QueryBuilder, Routes, Type, type PatreonQuery } from 'patreon-api.ts'

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

    // Or list resources to paginate multiple pages
    for await (const campaigns of client.paginateOauth2(Routes.campaigns(), query)) {
        for (const campaign of campaigns.data) {
            console.log(campaign.id)
        }
    }
}
// #endregion fetch-raw
// @ts-expect-error duplicate-imports
// #region fetch-rest
import { type PatreonClient, QueryBuilder, Routes, Type, type PatreonQuery, type GetResponsePayload } from 'patreon-api.ts'

export async function fetchPatreonRest (client: PatreonClient) {
    type Query = PatreonQuery<Type.Campaign, 'creator', {
        user: ('full_name')[]
    }, true>

    const { query } = QueryBuilder.fromParams<Query>(new URLSearchParams({
        include: 'creator',
        'fields[user]': 'full_name',
    }))

    // get the campaigns
    const campaigns = await client.rest.get<GetResponsePayload<Query>>(Routes.campaigns(), {
        accessToken: client.oauth.cachedToken?.access_token,
        query,
    })
    // or fetch the post(s), member(s), post(s) or current user

    // Or list resources to paginate multiple pages
    let nextCursor: string | null | undefined = campaigns.meta.pagination.cursors?.next
    const pages: GetResponsePayload<Query>[] = [campaigns]

    while (nextCursor) {
        const response = await client.rest.get<GetResponsePayload<Query>>(Routes.campaigns(), {
            accessToken: client.oauth.cachedToken?.access_token,
            query: query + encodeURIComponent(`&page[cursor]=${nextCursor}`),
        })

        pages.push(response)
        nextCursor = response.meta.pagination.cursors?.next
    }

    for (const campaigns of pages) {
        for (const campaign of campaigns.data) {
            console.log(campaign.id)
        }
    }
}
// #endregion fetch-rest
