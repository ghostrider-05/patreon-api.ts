/* eslint-disable no-undef */

import {
    buildQuery,
    PatreonCreatorClient,
    PatreonWebhookTrigger,
} from 'patreon-api.ts'

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
            if (init.body) console.log(init.body)

            return fetch(url, init)
        }
    }
})

const query = buildQuery.campaigns(['creator'])({
    user: ['social_connections']
})

const payload = await client.fetchCampaigns(query)
console.log(JSON.stringify(payload, null, 4))

const createWebhook = false

if (createWebhook) {
    const test = await client.webhooks.createWebhook({
        campaignId: process.env.CAMPAIGN_ID,
        triggers: [
            PatreonWebhookTrigger.PostPublished,
        ],
        uri: process.env.WEBHOOK_URI,
    })

    console.log(JSON.stringify(test, null, 4))
} else {
    const webhooks = await client.webhooks.fetchWebhooks(buildQuery.webhooks(['campaign'])())

    for (const webhook of webhooks.data) {
        if (webhook.attributes.paused) {
            await client.webhooks.unpauseWebhook(webhook.id)
        }
    }

    console.log(JSON.stringify(webhooks, null, 4))
}
