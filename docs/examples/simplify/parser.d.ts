// Can be in a seperate d.ts file
module 'patreon-api.ts' {
    interface ResponseTransformMap<Query extends BasePatreonQuery> {
        custom: (response: GetResponsePayload<Query>) => {
            response: GetResponsePayload<Query>
            campaign_id: string
        }
    }
}

import {
    type BasePatreonQuery,
    type GetResponsePayload,
    PatreonCreatorClient,
    QueryBuilder,
} from 'patreon-api.ts'

// Replace this with your client
declare const client: PatreonCreatorClient

// Use the same key as in the module augmentation above
const parser = PatreonCreatorClient.createCustomParser(client, 'custom', false, (res) => ({
    response: res,
    campaign_id: '123',
}))

const query = QueryBuilder.campaigns.addRelationships(['creator']).setAttributes({
    campaign: ['patron_count']
})

parser.fetchCampaigns(query)
    .then(payload => payload.response.data[0].relationships.creator.data.id)