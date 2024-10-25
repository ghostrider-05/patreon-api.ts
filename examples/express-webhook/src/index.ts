import {
    PatreonWebhookTrigger,
    parseWebhookRequest,
    WebhookPayloadClient,
    WebhookPayload,
    WebhookClient,
} from 'patreon-api.ts'

import express from 'express'

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            trigger: PatreonWebhookTrigger
            payload: WebhookPayload
        }
    }
}

const app = express()

app.use('/webhook', express.json(), async (request, response, next) => {
    if (request.method !== 'POST') {
        response.status(400).json('Invalid method')
        return
    }

    // TODO: why is this needed
    // Accessing headers in middleware apperently does not work, so copy them to headers
    for (const header of Object.values(WebhookClient.headers)) {
        request.headers[header] = request.header(header)
    }

    const result = await parseWebhookRequest(request, process.env.PATREON_WEBHOOK_SECRET)
    if (result.verified !== true) {
        response.status(403).json('Invalid signature')
        return
    }

    // TODO: not the best method, but it works for now
    request.trigger = result.event
    request.payload = result.payload

    next()
})

interface Embed extends Record<string, string | number> {
    title?: string
    color?: number
    description?: string
}

app.post('/webhook', async (request, response) => {
    const { trigger, payload } = request

    const converter = WebhookPayloadClient.convert<Embed>({
        default: {
            title: 'Updated post: {{title}}',
            color: 0x5865F2,
        }
    })

    const embed = converter(trigger, payload)
    console.log([embed])

    if (embed) {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            body: JSON.stringify({ embeds: [embed] }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
    }

    response.sendStatus(200)
})

app.listen('8080')
