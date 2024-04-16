import { 
    PatreonWebhookTrigger,
    Type,
    User,
    WebhookPayload,
} from "../../../../v2";

type TriggerType = 'create' | 'publish' | 'update' | 'delete'
type EventType = 'posts' | 'pledge' | 'members'

type CreateTrigger<E extends EventType, Trigger extends TriggerType> = `${E extends 'pledge' ? 'members:pledge' : E}:${Trigger}` extends infer T ? T extends `${PatreonWebhookTrigger}` ? T : never : never

interface DiscordMessage<E extends EventType, T extends TriggerType, Title, Color> {
    /**
     * For each type, the embed title.
     * Set context values in brackets: {key}
     * 
     * Available keys:
     * - event
     * - type
     * - user_id
     * - campaign_id
     */
    title: Title
    color: Color | number
    author?: (patron: User | undefined) => Record<'name' | 'icon_url' | 'url', string> | undefined
    extends?: (payload: WebhookPayload<CreateTrigger<E, T>>) => Record<string, any>
}

type DiscordMessages = {
    [E in EventType]: 
        | DiscordMessage<E, TriggerType, string, Record<TriggerType, number>>
        | DiscordMessage<E, TriggerType, Record<TriggerType, string>, Record<TriggerType, number>>
        | { [T in TriggerType]: DiscordMessage<E, T, string, number> }
}

function resolveOption <E extends EventType, T extends TriggerType>(options: DiscordMessages, event: E, trigger: T) {
    const raw = options[event]
    
    if ('title' in raw) {
        return {
            option: raw as DiscordMessage<E, T, string, Record<string, number>>,
            title: typeof raw.title === 'string' ? raw.title : raw.title[trigger]
        }
    } else {
        const option = raw[<TriggerType>trigger]
        return {
            option,
            title: option.title,
        }
    }
}

export function getWebhookUserId (data: WebhookPayload['data']) {
    return 'user' in data.relationships
        ? data.relationships.user.data.id
        : data.relationships.patron.data.id
}

export function webhookToDiscordEmbed (trigger: PatreonWebhookTrigger, payload: WebhookPayload, messages: DiscordMessages) {
    const [prefix, triggerType, isPledgeEvent] = trigger.split(':')

    const type = <TriggerType>(isPledgeEvent ? isPledgeEvent : triggerType)
    const event = <EventType>(isPledgeEvent ? 'pledge' : prefix)

    function replace (obj: Record<string, string>) {
        return (str: string) => {
            for (const key of Object.keys(obj)) {
                str = str.replaceAll(`{${key}}`, obj[key])
            }

            return str
        }
    }

    const campaignId = payload.data.relationships.campaign.data.id
    const userId = getWebhookUserId(payload.data)

    type IncludedUser = WebhookPayload['included'][number] extends infer I ? I extends { type: Type.User } ? I : never : never
    const user = <IncludedUser | undefined>payload.included.find((included) => included.type === Type.User && userId === included.id)

    const replacer = replace({
        user_id: userId,
        campaign_id: campaignId,
        type,
        event,
    })

    const { option, title } = resolveOption(messages, event, type)

    return {
        title: replacer(title),
        color: typeof option.color !== 'number'
            ? option.color[type]
            : option.color,
        author: option.author?.(user?.attributes),
        ...(option.extends?.(<never>payload)),
    }
}