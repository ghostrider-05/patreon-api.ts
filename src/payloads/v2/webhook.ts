import {
    type PatreonWebhookTrigger,
    type PatreonWebhookMemberTrigger,
    type PatreonWebhookPledgeTrigger,
    type PatreonWebhookPostTrigger,
} from '../../rest/v2/'

import {
    Type,
    type RelationshipFields,
    type RelationshipMap
} from '../../schemas/v2/'

import type { RequestPayload } from './internals/request'

export type CompletePayload<T extends Type> = RequestPayload<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>, false>

export type WebhookPayloadMap =
    & { [P in PatreonWebhookMemberTrigger]: CompletePayload<Type.Member> }
    // "In API v2, pledge has been deprecated and member is the resource of record"
    & { [P in PatreonWebhookPledgeTrigger]: CompletePayload<Type.Member> }
    & { [P in PatreonWebhookPostTrigger]: CompletePayload<Type.Post> }

export type WebhookPayload<
    Trigger extends PatreonWebhookTrigger = PatreonWebhookTrigger
> = WebhookPayloadMap[Trigger]

export type WebhookMemberPayload = WebhookPayload<
    | PatreonWebhookMemberTrigger
    | PatreonWebhookPledgeTrigger
>

export type WebhookPostPayload = WebhookPayload<PatreonWebhookPostTrigger>
