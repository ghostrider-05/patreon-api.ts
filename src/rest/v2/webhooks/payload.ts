import { type WebhookPayload } from '../../../payloads/v2'

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
    createPostEmbed?(trigger: PatreonWebhookPostTrigger): Data
    createMemberEmbed?(trigger: PatreonWebhookMemberTrigger | PatreonWebhookPledgeTrigger): Data
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

    public static isPostPayload (trigger: PatreonWebhookTrigger, payload: WebhookPayload): payload is WebhookPayload<PatreonWebhookPostTrigger> {
        return this.isPostTrigger(trigger)
    }

    private static createAttributeObj (value: unknown, attributes: Record<string, unknown>) {
        if (typeof value === 'number' || typeof value === 'boolean') {
            return value
        } else if (Array.isArray(value)) {
            return value.map(v => this.createAttributeObj(v, attributes))
        } else if (typeof value === 'object' && value != null) {
            return Object.entries(value).reduce((obj, [key, value]) => ({
                ...obj,
                [key]: this.createAttributeObj(value, attributes)
            }), {})
        } else if (typeof value === 'string') {
            return this.createAttributeText(value, attributes)
        }
    }

    public static convert <
        Data extends StringObject<string | number | boolean>
    >(converter: WebhookPayloadDataConverter<Data>) {
        return (trigger: PatreonWebhookTrigger, payload: WebhookPayload) => {
            const options = {
                ...((WebhookPayloadClient.isPostTrigger(trigger)
                    ? converter.createPostEmbed?.(trigger)
                    : converter.createMemberEmbed?.(trigger)
                )?? {}),
                ...(converter.default ?? {}),
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
        return this.payload.data.relationships.user.data.id
    }
}