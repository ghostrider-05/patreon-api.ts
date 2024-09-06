# Webhooks

## Webhook API

You can use the [Webhook API](https://docs.patreon.com/#apiv2-webhook-endpoints) to see or edit the webhooks your application has created.

```ts
const webhookClient = <Client>.webhooks
```

### Fetch webhooks

```ts
import { buildQuery } from 'patreon-api.ts'

const webhooks = webhookClient.fetchWebhooks(buildQuery.webhooks(['campaign'])())

for (const webhook of webhooks.data) {
    console.log(webhook.attributes.id)
}
```

### Create a webhook

You can create a new webhook for a certain campaign and specify the triggers and where to post to.

```ts
import { PatreonWebhookTrigger } from 'patreon-api.ts'

const createdWebhook = await webhookClient.createWebhook({
    campaignId: process.env.CAMPAIGN_ID,
    triggers: [
        PatreonWebhookTrigger.PostPublished,
    ],
    uri: process.env.WEBHOOK_URI,
})
```

> [!NOTE]
> While you can create a webhook, it is not possible to delete it (with the public API)

### Edit a webhook

You can edit the triggers and uri of the webhook you specified [while creating the webhook](#create-a-webhook).

```ts
await webhookClient.editWebhook({
    id: webhook.id,
    uri: process.env.NEW_WEBHOOK_URI,
})
```

If a webhook has failed to send events due to an outage or incorrect deploy, it will be paused. To unpause the webhook later, set `paused` to false:

```ts
await webhookClient.editWebhook({
    id: webhook.id,
    paused: false,
})

// Is the same as:
await webhookClient.unpauseWebhook(webhook.id)
```

## Webhook server

### Verify requests

To create a server for reading webhook payloads it is recommended to verify the incoming request from Patreon.

```ts
import { verify } from 'patreon-api.ts'

async function handleRequest (request, env) {
    const signature = request.headers['X-Patreon-Signature']
    const body = await request.text()

    if (!verify(env.WEBHOOK_SECRET, signature, body)) {
        return new Response('Invalid request', { status: 400 })
    }

    const payload = JSON.parse(body)
    // ...
}
```

You can get the webhook secret from the developer portal for your own webhooks or use `<webhook>.attributes.secret` for webhooks created by your application.

### Parse and verify

The library also exposes an `parseWebhookRequest` utility to verify and parse the trigger:

```ts
import { parseWebhookRequest } from 'patreon-api.ts'

async function handleRequest (request, env) {
    const parsed = await parseWebhookRequest(request, env.WEBHOOK_SECRET)

    if (!parsed.verified) {
        return new Response('Invalid request', { status: 400 })
    }

    const { trigger, payload } = parsed

    console.log('new event: ' + trigger)
    // ...
}
```

If your webhook only has one (type) of event you can also pass that event as a generic parameter:

```ts
import {
    parseWebhookRequest,
    PatreonWebhookTrigger,
    type PatreonWebhookPostTrigger,
} from 'patreon-api.ts'

// payload and trigger will now be typed as post published events
const parsed = await parseWebhookRequest<PatreonWebhookTrigger.PostPublished>(request, env.WEBHOOK_SECRET)
// Or for any post event:
const parsed = await parseWebhookRequest<PatreonWebhookPostTrigger>(request, env.WEBHOOK_SECRET)
```

