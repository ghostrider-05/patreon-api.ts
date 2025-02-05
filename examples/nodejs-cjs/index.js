/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const {
    buildQuery,
    PatreonCreatorClient,
} = require('patreon-api.ts')

const client = new PatreonCreatorClient({
    oauth: {
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        token: {
            access_token: process.env.ACCESS_TOKEN,
            refresh_token: process.env.REFRESH_TOKEN,
        }
    },
    rest: {
        fetch: (url, init) => {
            // Log all requests made to Patreon API
            console.log(`[${init.method}] ${url}`)

            return fetch(url, init)
        },
    }
})

const query = buildQuery.campaigns(['creator'])({
    user: ['social_connections']
})



client.fetchCampaigns(query)
    .then(payload => console.log(JSON.stringify(payload.included[0].attributes.social_connections, null, 4)))

const parser = PatreonCreatorClient.createCustomParser(client, 'custom', (res) => ({
    response: res,
    campaign_id: '',
}), false)

parser.fetchCampaigns(query)
    .then(payload => payload.response.data[0].relationships.creator.data.id)
