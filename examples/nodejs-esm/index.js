/* eslint-disable no-undef */

import {
    buildQuery,
    PatreonCreatorClient,
} from '../../dist/index.js'

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

const payload = await client.fetchCampaigns(query)
console.log(JSON.stringify(payload, null, 4))
