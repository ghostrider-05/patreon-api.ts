// #region api-client
import { PatreonCreatorClient, WebhookClient } from 'patreon-api.ts'

// Replace with your client
declare const patreon: PatreonCreatorClient

const client = new WebhookClient(patreon.oauth)
// or:
const { webhooks } = patreon
// #endregion api-client
// #region api-fetch
import { QueryBuilder, WebhookClient } from 'patreon-api.ts'

declare const client: WebhookClient

const query = QueryBuilder.webhooks.setAttributes({
    webhook: ['paused', 'triggers', 'uri'],
})

const response = await client.fetchWebhooks(query)

for (const webhook of response.data) {
    console.log(webhook.id, webhook.attributes.uri)
}
// #endregion api-fetch
// #region api-create
import { PatreonWebhookTrigger, WebhookClient } from 'patreon-api.ts'

declare const client: WebhookClient

const createdWebhook = await client.createWebhook({
    campaignId: 'my-campaign-id',
    triggers: [
        PatreonWebhookTrigger.PostPublished,
    ],
    uri: 'https://my-server-url.com/incoming-webhooks/patreon',
})
// #endregion api-create
// #region api-update
import { WebhookClient } from 'patreon-api.ts'

declare const client: WebhookClient

const updatedWebhook = await client.editWebhook({
    id: 'my-webhook-id',
    uri: 'https://new-website.com/incoming-webhooks/patreon'
})
// #endregion api-update
// #region api-update-pause
import { WebhookClient } from 'patreon-api.ts'

declare const client: WebhookClient

const updatedWebhook = await client.editWebhook({
    id: 'my-webhook-id',
    paused: false,
})
// or:
await client.unpauseWebhook('my-webhook-id')
// #endregion api-update-pause
// #region api-delete
import { WebhookClient } from 'patreon-api.ts'

declare const client: WebhookClient

await client.deleteWebhook('my-webhook-id')
// #endregion api-delete
// #region verify
import { verify, type WebhookPayload } from 'patreon-api.ts'

async function handleRequest (request: Request, env: { WEBHOOK_SECRET: string }) {
    const signature = request.headers.get('X-Patreon-Signature')
    const body = await request.text()

    if (!verify(env.WEBHOOK_SECRET, signature, body)) {
        return new Response('Invalid request', { status: 400 })
    }

    const payload: WebhookPayload = JSON.parse(body)
    // ...
}
// #endregion verify
// #region parse
import { parseWebhookRequest } from 'patreon-api.ts'

async function handleRequest (request: Request, env: { WEBHOOK_SECRET: string }) {
    const parsed = await parseWebhookRequest(request, env.WEBHOOK_SECRET)

    if (!parsed.verified) {
        return new Response('Invalid request', { status: 400 })
    }

    const { event, payload } = parsed

    console.log('new event: ' + event)
    // ...
}
// #endregion parse
// #region parse-type
import {
    parseWebhookRequest,
    PatreonWebhookTrigger,
    type PatreonWebhookPostTrigger,
} from 'patreon-api.ts'

declare const request: Request
declare const env: {
    WEBHOOK_SECRET: string
}

// payload and trigger will now be typed as post published events
const publishedPostResult = await parseWebhookRequest<PatreonWebhookTrigger.PostPublished>(request, env.WEBHOOK_SECRET)
// Or for any post event:
const anyPostResult = await parseWebhookRequest<PatreonWebhookPostTrigger>(request, env.WEBHOOK_SECRET)
// #endregion parse-type
// #region payload-client
import { parseWebhookRequest, WebhookPayloadClient } from 'patreon-api.ts'

declare const env: {
    PATREON_WEBHOOK_SECRET: string
}

async function handleRequest (request: Request) {
    const result = await parseWebhookRequest(request, env.PATREON_WEBHOOK_SECRET)

    if (result.verified) {
        const payload = new WebhookPayloadClient(result.event, result.payload)

        console.log(
            'Campaign id: ' + payload.campaignId,
            'User id: ' + payload.userId,
        )
    }
}

// #endregion payload-client
// #region payload-convert-discord-posts
import { parseWebhookRequest, WebhookPayloadClient } from 'patreon-api.ts'

declare const env: {
    PATREON_WEBHOOK_SECRET: string
    DISCORD_WEBHOOK_URL: string
}

const converter = WebhookPayloadClient.convert({
    posts: {
        'posts:publish': {
            title: '{{title}} is published',
            color: 0,
            fields: [{
                name: 'Is public',
                value: '{{is_public}}',
                inline: true,
            }],
        },
    }
})

async function handleRequest (request: Request) {
    const result = await parseWebhookRequest(request, env.PATREON_WEBHOOK_SECRET)

    if (result.verified) {
        await fetch(env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [
                    converter(result.event, result.payload)
                ],
            })
        })
    }
}
// #endregion payload-convert-discord-posts