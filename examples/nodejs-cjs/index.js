/* eslint-disable @typescript-eslint/no-var-requires */
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
            console.log(`[${init.method}] ${url}`)

            return fetch(url, init)
        }
    }
})

const query = buildQuery.campaigns(['creator'])({
    user: ['social_connections']
})

client.fetchCampaigns(query)
    .then(payload => console.log(JSON.stringify(payload, null, 4)))
