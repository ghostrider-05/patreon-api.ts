import {
    PatreonWebhookTrigger,
    WebhookToDiscordMessages,
    parseWebhookRequest,
    webhookToDiscordEmbed,
} from '../../../src'

import { NodeHtmlMarkdown } from 'node-html-markdown'

// Replace this with your own html -> markdown function
// To use this library, comment the process.env.LOG_PERF lines in dist/utilities.js and deploy
// TODO: look into other library
function html2md (html: string): string {
    return new NodeHtmlMarkdown().translate(html)
}

interface EnvWithSecrets extends Env {
    DISCORD_WEBHOOK_URL: string
    PATREON_WEBHOOK_SECRET: string
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

        const options: WebhookToDiscordMessages = {
            [PatreonWebhookTrigger.PostPublished]: {
                color: 0x5865F2,
                title: 'New post: {title}',
                addContextKeys(payload) {
                    return {
                        title: payload.data.attributes.title,
                    }
                },
                extends(payload) {
                    return {
                        description: html2md(payload.data.attributes.content),
                    }
                },
            }
        }

        const embed = webhookToDiscordEmbed(event, payload, options)
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