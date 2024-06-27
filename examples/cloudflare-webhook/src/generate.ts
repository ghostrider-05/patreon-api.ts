import {
    PatreonCreatorClient,
    PatreonWebhookTrigger,
} from 'patreon-api.ts'

import * as secrets from './secrets.json'

// Redefine to not throw an error on missing secrets
const env: Record<string, string> = secrets

const client = new PatreonCreatorClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
        token: {
            access_token: env.ACCESS_TOKEN,
            refresh_token: env.REFRESH_TOKEN,
        }
    },
    rest: {
        fetch: (url, init) => {
            console.log(`[${init.method}] ${url}`)
            if (init.body) console.log(init.body)

            return fetch(url, init)
        }
    }
});

(async () => {
    const webhook = await client.webhooks.createWebhook({
        campaignId: env.CAMPAIGN_ID,
        triggers: [
            PatreonWebhookTrigger.PostPublished,
        ],
        uri: env.WEBHOOK_URI,
    })

    console.log('Secret: ' + webhook.data.attributes.secret)
})()

