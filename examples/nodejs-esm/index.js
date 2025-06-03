/* eslint-disable no-undef */

import {
    normalize,
    PatreonCreatorClient,
    PatreonWebhookTrigger,
    simplify,
    QueryBuilder,
    Routes,
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

const query = QueryBuilder.campaigns
    .addRelationshipAttributes('creator', ['social_connections'])

const payload = await client.fetchCampaigns(query)
console.log(
    JSON.stringify(payload, null, 4),
    JSON.stringify(normalize(payload), null, 4),
    JSON.stringify(simplify(payload), null, 4),
)

// Some actions you can take as example
const createWebhook = false
const unpauseAllWebhooks = false
const listWebhooks = true

if (createWebhook) {
    const test = await client.webhooks.createWebhook({
        campaignId: process.env.CAMPAIGN_ID,
        triggers: [
            PatreonWebhookTrigger.PostPublished,
        ],
        uri: process.env.WEBHOOK_URI,
    })

    console.log(JSON.stringify(test, null, 4))
}

if (unpauseAllWebhooks) {
    const webhookQuery = QueryBuilder.webhooks
        .addRelationships(['campaign'])
        .setAttributes({ webhook: ['paused'] })

    const webhooks = await client.webhooks.fetchWebhooks(webhookQuery)

    for (const webhook of webhooks.data) {
        if (webhook.attributes.paused) {
            await client.webhooks.unpauseWebhook(webhook.id)
        }
    }

    console.log(JSON.stringify(webhooks, null, 4))
}

if (listWebhooks) {
    const webhookQuery = QueryBuilder.webhooks
        .setAttributes({ webhook: ['uri', 'triggers'] })
        .setRequestOptions({ count: 1 })

    for await (const page of client.paginateOauth2(Routes.webhooks(), webhookQuery)) {
        console.log(JSON.stringify(page, null, 4))
    }
}
