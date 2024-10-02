import { buildQuery, PatreonCreatorClient } from '../../../../dist'
import { webhookPath } from '../webhook/webhook'

export interface ConfigurePatreonOptions {
    unpause_webhooks?: boolean
    register_webhooks?: boolean
}

/**
 *
 * @param env Env
 * @param options Configuration options
 */
export async function configurePatreon (env: Config.Env, options: ConfigurePatreonOptions) {
    const client = new PatreonCreatorClient({
        oauth: {
            clientId: env.PATREON_CLIENT_ID,
            clientSecret: env.PATREON_CLIENT_SECRET,
            token: {
                access_token: env.PATREON_ACCESS_TOKEN,
                refresh_token: env.PATREON_REFRESH_TOKEN,
            },
        }
    })

    const webhookQuery = buildQuery.webhooks()({
        webhook: ['paused', 'secret', 'triggers', 'uri'],
    })

    const registeredWebhooks = await client.webhooks.fetchWebhooks(webhookQuery)
    const webhooksToUnpause: string[] = []
    const webhooksToRegister = env.campaigns.filter(({ webhook }) => {
        for (const { attributes: item, id } of registeredWebhooks?.data ?? []) {
            if (webhook) {
                const equals = env[webhook.secret_name ?? 'PATREON_WEBHOOK_SECRET'] === item.secret
                    && webhook.triggers.length === item.triggers.length
                    && webhook.triggers.every(t => item.triggers.includes(t))

                if (equals && item.paused) {
                    webhooksToUnpause.push(id)
                }

                return !equals
            }
        }

        return false
    })

    for (const id of webhooksToUnpause) {
        if (options.unpause_webhooks) await client.webhooks.unpauseWebhook(id)
    }

    for (const { webhook, id } of webhooksToRegister) {
        if (options.register_webhooks) await client.webhooks.createWebhook({
            campaignId: id,
            uri: env.worker_url + (webhook?.path ?? webhookPath),
            triggers: webhook?.triggers ?? [],
        })
    }
}