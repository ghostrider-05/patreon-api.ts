import { 
    PatreonWebhookTrigger,
    Type,
    User,
    WebhookPayload,
} from "../../../../v2";

import { getWebhookUserId } from '../client'

interface WebhookToDiscordMessage<Trigger extends PatreonWebhookTrigger, Title> {
    /**
     * For each type, the embed title.
     * Set context values in brackets: {key}
     * 
     * Available keys:
     * - user_id
     * - campaign_id
     */
    title: Title
    color: number
    addContextKeys?: (
        payload: WebhookPayload<Trigger>,
    ) => Record<string, string | number>
    author?: (
        patron: User | undefined,
        replacer: (str: string) => string,
    ) => Record<'name' | 'icon_url' | 'url', string> | undefined
    extends?: (
        payload: WebhookPayload<Trigger>,
        replacer: (str: string) => string,
    ) => Record<string, any>
}

export type WebhookToDiscordMessages = Partial<{
    [E in PatreonWebhookTrigger]: WebhookToDiscordMessage<E, string>
}>

export function webhookToDiscordEmbed (trigger: PatreonWebhookTrigger, payload: WebhookPayload, messages: WebhookToDiscordMessages) {
    function replace (obj: Record<string, string>) {
        return (str: string) => {
            for (const key of Object.keys(obj)) {
                str = str.replaceAll(`{${key}}`, obj[key])
            }

            return str
        }
    }

    const campaignId = payload.data.relationships.campaign.data.id
    const userId = getWebhookUserId(payload)

    type IncludedUser = WebhookPayload['included'][number] extends infer I ? I extends { type: Type.User } ? I : never : never
    const user = <IncludedUser | undefined>payload.included.find((included) => included.type === Type.User && userId === included.id)

    const option = messages[trigger]
    const replacer = replace({
        ...(option?.addContextKeys?.(<never>payload) ?? {}),
        user_id: userId,
        campaign_id: campaignId,
    })

    if (!option) return undefined
    else return {
        title: replacer(option.title),
        color: option.color,
        author: option.author?.(user?.attributes, replacer),
        ...(option.extends?.(<never>payload, replacer)),
    }
}