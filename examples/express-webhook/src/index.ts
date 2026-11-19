/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
    parseWebhookRequest,
    WebhookPayloadClient,
} from 'patreon-api.ts'

import express from 'express'

const app = express()

interface Embed extends Record<string, string | number | undefined> {
    title?: string
    color?: number
    description?: string
}

app.post('/webhook', express.json(), async (request, response) => {
    const result = await parseWebhookRequest(request, process.env.PATREON_WEBHOOK_SECRET!)
    if (result.verified !== true) {
        response.status(403).json('Invalid signature')
        return
    }

    const converter = WebhookPayloadClient.convert<Embed>({
        default: {
            title: 'Updated post: {{title}}',
            color: 0x5865F2,
        }
    })

    const embed = converter(result.event, result.payload)
    console.log([embed])

    if (embed) {
        await fetch(process.env.DISCORD_WEBHOOK_URL!, {
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
