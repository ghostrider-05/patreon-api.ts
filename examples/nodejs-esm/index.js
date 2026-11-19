/* eslint-disable jsdoc/no-types */
/* eslint-disable jsdoc/require-param-description */
/* eslint-disable no-undef */

import {
    normalize,
    PatreonCreatorClient,
    PatreonWebhookTrigger,
    simplify,
    QueryBuilder,
    Routes,
} from 'patreon-api.ts'

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

if (!process.env.CI) await logCampaign(client)

// Some actions you can take as example
const createWebhook = false
const unpauseAllWebhooks = false
const listWebhooks = true

if (!process.env.CI && createWebhook && process.env.CAMPAIGN_ID && process.env.WEBHOOK_URI) {
    const test = await client.webhooks.createWebhook({
        campaignId: process.env.CAMPAIGN_ID,
        triggers: [
            PatreonWebhookTrigger.PostPublished,
        ],
        uri: process.env.WEBHOOK_URI,
    })

    log(test)
}

if (!process.env.CI && unpauseAllWebhooks) {
    const webhookQuery = QueryBuilder.webhooks
        .addRelationships(['campaign'])
        .setAttributes({ webhook: ['paused'] })

    const webhooks = await client.webhooks.fetchWebhooks(webhookQuery)

    for (const webhook of webhooks.data) {
        if (webhook.attributes.paused) {
            await client.webhooks.unpauseWebhook(webhook.id)
        }
    }

    log(webhooks)
}

if (!process.env.CI && listWebhooks) {
    const webhookQuery = QueryBuilder.webhooks
        .setAttributes({ webhook: ['uri', 'triggers'] })
        .setRequestOptions({ count: 1 })

    for await (const page of client.paginateOauth2(Routes.webhooks(), webhookQuery)) {
        log(page)
    }
}

/** @param {PatreonCreatorClient} client  */
async function logCampaign (client) {
    const query = QueryBuilder.campaigns
        .addRelationshipAttributes('creator', ['social_connections'])

    const payload = await client.fetchCampaigns(query)
    console.log(
        JSON.stringify(payload, null, 4),
        JSON.stringify(normalize(payload), null, 4),
        JSON.stringify(simplify(payload), null, 4),
    )
}

/** @param {unknown} response */
function log (response) {
    console.log(JSON.stringify(response, null, 4))
}
