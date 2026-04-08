import type { AccessRule as Schema } from './access_rule'
import type { Address as AddressSchema } from './address'
import type { Benefit as BenefitSchema } from './benefit'
import type { Campaign as CampaignSchema } from './campaign'
import type { Deliverable as DeliverableSchema } from './deliverable'
import type { Goal as GoalSchema } from './goal'
import type { Live as LiveSchema } from './live'
import type { Media as MediaSchema } from './media'
import type { Member as MemberSchema } from './member'
import type { OauthClient as OauthClientSchema } from './oauth_client'
import type { Post as PostSchema } from './post'
import type { PledgeEvent as PledgeEventSchema } from './pledge_event'
import type { Tier as TierSchema } from './tier'
import type { User as UserSchema } from './user'
import type { Webhook as WebhookSchema } from './webhook'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SchemaResources {
    export type AccessRule = Schema
    export type Address = AddressSchema
    export type Benefit = BenefitSchema
    export type Campaign = CampaignSchema
    export type Deliverable = DeliverableSchema
    /** @deprecated */
    export type Goal = GoalSchema
    export type Live = LiveSchema
    export type Media = MediaSchema
    export type Member = MemberSchema
    export type OauthClient = OauthClientSchema
    export type Post = PostSchema
    export type PledgeEvent = PledgeEventSchema
    export type Tier = TierSchema
    export type User = UserSchema
    export type Webhook = WebhookSchema
}
