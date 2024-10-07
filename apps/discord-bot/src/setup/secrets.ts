import { PatreonWebhookTrigger } from 'patreon-api.ts'

/**
 *
 * @param env
 */
function validateWebhookSecrets(env: Config.WebhookMessageConfig | undefined) {
    if (env?.discord_webhook) {
        if (typeof env[env.discord_webhook.url_secret_name] !== 'string') {
            throw new Error('No Discord webhook secret found for: ' + env.discord_webhook.url_secret_name)
        }
    }

    if (env?.posts?.message_storage) {
        if (!env[env.posts.message_storage.env_name]) {
            throw new Error('No message storage found with name: ' + env.posts.message_storage.env_name)
        }
    }
}

/**
 *
 * @param env
 */
export function validateSecrets(env: Config.Env) {
    if (env.use_bot_scope && !env.DISCORD_BOT_TOKEN) {
        throw new Error('No Discord bot token configured')
    }

    if (env.linked_roles && !env.DISCORD_CLIENT_SECRET) {
        throw new Error('No Discord client secret configured')
    }

    if (!env.PATREON_CLIENT_ID) throw new Error('Missing Patreon client id')
    if (!env.PATREON_CLIENT_SECRET) throw new Error('Missing Patreon client secret')

    for (const campaign of env.campaigns) {
        const { webhook, guild } = campaign
        const name = campaign.webhook?.secret_name ?? 'PATREON_WEBHOOK_SECRET'

        if (webhook && (env[name] == undefined || typeof env[name] !== 'string')) {
            throw new Error('No Patreon webhook secret found for: ' + name)
        }

        validateWebhookSecrets(webhook)

        for (const trigger of Object.values(PatreonWebhookTrigger)) {
            validateWebhookSecrets(webhook?.[trigger])
        }

        if (guild.roles) {
            const name = guild.roles.storage?.env_name

            if (!env[name]) {
                throw new Error('No Patreon member storage found with name: ' + name)
            }
        }
    }
}
