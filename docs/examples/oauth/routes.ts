//#region campaign
import { PatreonCreatorClient, QueryBuilder } from 'patreon-api.ts'

declare const client: PatreonCreatorClient

const campaignQuery = QueryBuilder.campaign
    .addRelationships(['tiers'])
    .setRelationshipAttributes('tiers', ['amount_cents', 'title'])

const campaign = await client.fetchCampaign('campaign_id', campaignQuery)

const tiers = campaign.included.map(item => item.attributes)
//#endregion campaign
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