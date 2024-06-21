import {
    PatreonWebhookTrigger,
    type PatreonWebhookMemberTrigger,
    type PatreonWebhookPledgeTrigger,
    type PatreonWebhookPostTrigger,
} from '../../rest/v2/'
import {
    type RelationshipFields,
    type RelationshipMap,
    Type,
} from '../../schemas/v2/'

import { RequestPayload } from './internals/request'

export type CompletePayload<T extends Type> = RequestPayload<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>, false>

export type WebhookPayloadMap =
    & { [P in PatreonWebhookMemberTrigger]: CompletePayload<Type.Member> }
    & { [P in PatreonWebhookPledgeTrigger]: CompletePayload<Type.PledgeEvent> }
    & { [P in PatreonWebhookPostTrigger]: CompletePayload<Type.Post> }

export type WebhookPayload<
    Trigger extends PatreonWebhookTrigger = PatreonWebhookTrigger
> = WebhookPayloadMap[Trigger]
