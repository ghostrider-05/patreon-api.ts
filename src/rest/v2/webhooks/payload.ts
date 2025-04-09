import { type WebhookPayload } from '../../../payloads/v2'
import {
    type AttributeItem,
    type Campaign,
    Type,
    type User,
} from '../../../schemas/v2'

import {
    type PatreonWebhookMemberTrigger,
    type PatreonWebhookPledgeTrigger,
    type PatreonWebhookPostTrigger,
    PatreonWebhookTrigger,
} from './triggers'

type StringObject<Value> = Partial<Record<string,
    | Value
    | Partial<Record<string, Value>>
    | Partial<Record<string, Value>>[]
>>

export interface WebhookPayloadDataConverter<Data extends StringObject<string | number | boolean>> {
    default?: Data
    posts?: Partial<Record<PatreonWebhookPostTrigger, Data>>
    member?: Partial<Record<PatreonWebhookMemberTrigger | PatreonWebhookPledgeTrigger, Data>>
}

export class WebhookPayloadClient<Trigger extends PatreonWebhookTrigger> {
    public static createAttributeText <Keys extends string>(
        option: string | undefined,
        attributes: Record<Keys, unknown>,
        attribute?: Keys,
        unknown?: string
    ) {
        return option != undefined
            ? Object.keys(attributes).reduce((text, key) => {
                if (attributes[key] == null) return text
                return text.replace(`{{${key}}}`, attributes[key])
            }, option)
            : new String((attribute ? attributes[attribute] : undefined) ?? unknown ?? '').toString()
    }

    public static isPostTrigger (trigger: PatreonWebhookTrigger): trigger is PatreonWebhookPostTrigger {
        const postTriggers = [
            PatreonWebhookTrigger.PostDeleted,
            PatreonWebhookTrigger.PostPublished,
            PatreonWebhookTrigger.PostUpdated,
        ]

        return postTriggers.includes(trigger)
    }

    public static isPostPayload (
        trigger: PatreonWebhookTrigger,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Use ignore comment for typeguard
        payload: WebhookPayload,
    ): payload is WebhookPayload<PatreonWebhookPostTrigger> {
        return this.isPostTrigger(trigger)
    }

    private static createAttributeObj (value: unknown, attributes: Record<string, unknown>) {
        if (typeof value === 'number' || typeof value === 'boolean') {
            return value
        } else if (typeof value === 'string') {
            return this.createAttributeText(value, attributes)
        } else if (Array.isArray(value)) {
            return value.map(v => this.createAttributeObj(v, attributes))
        } else if (typeof value === 'object' && value != null) {
            return Object.entries(value).reduce((obj, [key, value]) => ({
                ...obj,
                [key]: this.createAttributeObj(value, attributes)
            }), {})
        }
    }

    public static convert <
        Data extends StringObject<string | number | boolean>
    >(converter: WebhookPayloadDataConverter<Data>) {
        return (trigger: PatreonWebhookTrigger, payload: WebhookPayload) => {
            const options = {
                ...(converter.default ?? {}),
                ...((WebhookPayloadClient.isPostTrigger(trigger)
                    ? converter.posts?.[trigger]
                    : converter.member?.[trigger]
                ) ?? {}),
            }

            return Object.entries(options).reduce((obj, [key, value]) => ({
                ...obj,
                [key]: this.createAttributeObj(value, payload.data.attributes),
            }), {} as Data)
        }
    }

    public constructor (
        public trigger: Trigger,
        public payload: WebhookPayload<Trigger>,
    ) {}

    public get userId () {
        // Make nullable when this is not included in webhook payloads
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.payload.data.relationships.user.data!.id
    }

    public get user () {
        return <
            | AttributeItem<Type.User, Pick<User, keyof User>>
            | undefined
        >this.payload.included.find(item => {
            return item.type === Type.User && item.id === this.userId
        })
    }

    public get campaignId () {
        // Make nullable when this is not included in webhook payloads
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.payload.data.relationships.campaign.data!.id
    }

    public get campaign () {
        return <
            | AttributeItem<Type.Campaign, Pick<Campaign, keyof Campaign>>
            | undefined
        >this.payload.included.find(item => {
            return item.type === Type.Campaign && item.id === this.campaignId
        })
    }
}