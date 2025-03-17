import {
    Type,
    type PatreonWebhookTrigger,
    type User,
    type WebhookPayload,
} from '../../../../v2'

import { getWebhookUserId } from '../client'

/** @deprecated */
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Record<string, any>
}

/** @deprecated */
export type WebhookToDiscordMessages = Partial<{
    [E in PatreonWebhookTrigger]: WebhookToDiscordMessage<E, string>
}>

/**
 * Easily convert a Patreon webhook to a Discord embed
 * @param trigger The event from the Patreon webhook headers
 * @param payload The incoming webhook payload from Patreon
 * @param messages The options to convert webhook payloads to embed fields
 * @returns Discord embeds that can be sent using webhooks.
 * `undefined` if no options are found for this trigger.
 * @deprecated
 */
export function webhookToDiscordEmbed (trigger: PatreonWebhookTrigger, payload: WebhookPayload, messages: WebhookToDiscordMessages) {
    /**
     * Replaces a string with template keys with their values: `{title} is new!` -> `My new post is new!`
     * @param obj the options with the template values
     * @returns a string with all template values replaced
     */
    function replaceTemplateKeys (obj: Record<string, string>) {
        return (str: string) => {
            for (const key of Object.keys(obj)) {
                str = str.replaceAll(`{${key}}`, obj?.[key] ?? '')
            }

            return str
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const campaignId = payload.data.relationships.campaign!.data.id
    const userId = getWebhookUserId(payload)

    type IncludedUser = WebhookPayload['included'][number] extends infer I ? I extends { type: Type.User } ? I : never : never
    const user = <IncludedUser | undefined>payload.included.find((included) => included.type === Type.User && userId === included.id)

    const option = messages[trigger]
    const replacer = replaceTemplateKeys({
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
