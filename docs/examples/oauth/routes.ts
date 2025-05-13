// @ts-expect-error duplicate-imports
//#region campaign
import { PatreonCreatorClient, QueryBuilder } from 'patreon-api.ts'

declare const client: PatreonCreatorClient

const campaignQuery = QueryBuilder.campaign
    .addRelationships(['tiers'])
    .setRelationshipAttributes('tiers', ['amount_cents', 'title'])

const campaign = await client.fetchCampaign('campaign_id', campaignQuery)

const tiers = campaign.included.map(item => item.attributes)
//#endregion campaign
// @ts-expect-error duplicate-imports
//#region campaigns
import { PatreonCreatorClient, QueryBuilder } from 'patreon-api.ts'

declare const client: PatreonCreatorClient

const campaignsQuery = QueryBuilder.campaigns
    .setAttributes({ campaign: ['patron_count'] })

const campaigns = await client.fetchCampaigns(campaignsQuery)

for (const campaign of campaigns.data) {
    console.log(campaign.id, campaign.attributes.patron_count)
}
//#endregion campaigns
// @ts-expect-error duplicate-imports
//#region campaigns-paginate
import { PatreonCreatorClient, QueryBuilder } from 'patreon-api.ts'

declare const client: PatreonCreatorClient

const campaignsQuery = QueryBuilder.campaigns
    .setAttributes({ campaign: ['patron_count'] })

for await (const page of client.paginateCampaigns(campaignsQuery)) {
    for (const campaign of page.data) {
        console.log(campaign.id, campaign.attributes.patron_count)
    }
}
//#endregion campaigns-paginate
// @ts-expect-error duplicate-imports
//#region members
import { PatreonCreatorClient, QueryBuilder } from 'patreon-api.ts'

declare const client: PatreonCreatorClient

const membersQuery = QueryBuilder.campaignMembers
    .setAttributes({ member: ['patron_status'] })
    .setRequestOptions({ count: 100 }) // 100 members per page

const members = await client.fetchCampaignMembers('campaign_id', membersQuery)

for (const member of members.data) {
    console.log('Member with id', member.id, 'has status', member.attributes.patron_status)
}
//#endregion members
// @ts-expect-error duplicate-imports
//#region members-paginate
import { PatreonCreatorClient, QueryBuilder } from 'patreon-api.ts'

declare const client: PatreonCreatorClient

const membersQuery = QueryBuilder.campaignMembers
    .setAttributes({ member: ['patron_status'] })
    .setRequestOptions({ count: 100 }) // 100 members per page

for await (const page of client.paginateCampaignMembers('campaign_id', membersQuery)) {
    for (const member of page.data) {
        console.log('Member with id', member.id, 'has status', member.attributes.patron_status)
    }
}
//#endregion members-paginate
