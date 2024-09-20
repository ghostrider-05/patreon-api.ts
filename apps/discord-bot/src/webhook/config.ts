import {
    type WebhookPayload,
    WebhookPayloadClient,
} from 'patreon-api.ts'

/**
 *
 * @param configs
 * @param trigger
 * @param payload
 */
export function getConfig (configs: Config.WebhookMessageConfig[], trigger: Config.WebhookTrigger, payload: WebhookPayload) {
    if (!WebhookPayloadClient.isPostPayload(trigger, payload)) return configs[0]
    else {
        return configs.find(config => {
            const { only_paid_posts, only_public_posts, required_tiers } = config.posts ?? {}

            if (only_paid_posts && !payload.data.attributes.is_paid) return false
            else if (only_public_posts && !payload.data.attributes.is_public) return false
            else if (required_tiers?.length && !required_tiers.every(tier => payload.data.attributes.tiers.includes(tier))) return false
            else return true
        })
    }
}

interface ConfigData {
    options: Config.WebhookMessageConfig[]
    secretName: string
    campaign: Config.CampaignConfig
}

/**
 *
 * @param path
 * @param trigger
 * @param campaigns
 * @param webhookPath
 */
export function getPossibleWebhookConfigs (
    path: string,
    trigger: Config.WebhookTrigger,
    campaigns: Config.CampaignConfig[],
    webhookPath: string,
): ConfigData | undefined {
    const campaign = path === webhookPath
        ? campaigns[0]
        : (campaigns.find(campaign => campaign.webhooks_path && campaign.webhooks_path === path))
    if (campaign == undefined) return undefined

    return {
        secretName: campaign.webhooks_secret_name ?? 'PATREON_WEBHOOK_SECRET',
        campaign,
        options: campaign.webhooks
            ?.filter(config => config.triggers.includes(trigger))
            .map(config => ({
                ...(config[trigger] ?? {}),
                ...config,
                posts: {
                    ...(config[trigger]?.posts ?? {}),
                    ...(config.posts ?? {}),
                },
            }) satisfies Config.WebhookMessageConfig)
            ?? []
    }
}
