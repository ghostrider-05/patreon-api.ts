/* eslint-disable jsdoc/require-param-description */
/* eslint-disable jsdoc/no-types */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const {
    PatreonCreatorClient,
    QueryBuilder,
} = require('patreon-api.ts')

if (!process.env.ACCESS_TOKEN || !process.env.REFRESH_TOKEN) {
    throw new Error('No token provided')
}

const client = new PatreonCreatorClient({
    oauth: {
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        token: {
            access_token: process.env.ACCESS_TOKEN,
            refresh_token: process.env.REFRESH_TOKEN,
        },
    },
    rest: {
        fetch: (url, init) => {
            // Log all requests made to Patreon API
            console.log(`[${init.method}] ${url}`)

            return fetch(url, init)
        },
    }
})

console.log(client.oauth.userAgent)
fetchCampaigns(client)

/** @param {PatreonCreatorClient} client  */
async function fetchCampaigns (client) {
    if (process.env.CI) {
        return
    }

    const query = QueryBuilder.campaigns
        .addRelationshipAttributes('creator', ['social_connections'])

    await client.fetchCampaigns(query)
        .then(payload => console.log(JSON.stringify(payload.included[0].attributes.social_connections, null, 4)))

    const parser = PatreonCreatorClient.createCustomParser(client, 'custom', (res) => ({
        response: res,
        campaign_id: '',
    }))

    await parser.fetchCampaigns(query)
        .then(payload => payload.response.data[0].relationships.creator.data?.id)
}
