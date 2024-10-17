import {
    PatreonWebhookTrigger,
    parseWebhookRequest,
    WebhookPayloadClient,
} from 'patreon-api.ts'

import { renderPost } from './md'

interface EnvWithSecrets {
    DISCORD_WEBHOOK_URL: string
    PATREON_WEBHOOK_SECRET: string
    HTML_MD_KEY: string
}

interface Embed extends Record<string, string | number> {
    title?: string
    color?: number
    description?: string
}

export default <ExportedHandler<EnvWithSecrets>> {
    async fetch (request, env) {
        if (request.method !== 'POST') {
            return new Response(JSON.stringify('Invalid method'), { status: 400 })
        }

        const result = await parseWebhookRequest<PatreonWebhookTrigger.PostPublished>(request, env.PATREON_WEBHOOK_SECRET)
        if (result.verified !== true) {
            return new Response('Invalid signature', { status: 403 })
        }

        const { event, payload } = result
        const description = await renderPost(payload.data.attributes.content ?? '', env.HTML_MD_KEY)

        const converter = WebhookPayloadClient.convert<Embed>({
            default: {
                title: 'New post: {{title}}',
                color: 0x5865F2,
                description,
            }
        })

        const embed = converter(event, payload)

        if (embed) {
            return await fetch(env.DISCORD_WEBHOOK_URL, {
                method: 'POST',
                body: JSON.stringify({ embeds: [embed] }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        }
    }
}