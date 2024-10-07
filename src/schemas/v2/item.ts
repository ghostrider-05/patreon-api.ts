import type { If } from '../../utils/generics'

import type { Address } from './resources/address'
import type { Benefit } from './resources/benefit'
import type { Campaign } from './resources/campaign'
import type { Deliverable } from './resources/deliverable'
import type { Goal } from './resources/goal'
import type { Media } from './resources/media'
import type { Member } from './resources/member'
import type { OauthClient } from './resources/oauth_client'
import type { Post } from './resources/post'
import type { PledgeEvent } from './resources/pledge_event'
import type { Tier } from './resources/tier'
import type { User } from './resources/user'
import type { Webhook } from './resources/webhook'

export enum Type {
    Address = 'address',
    Benefit = 'benefit',
    Campaign = 'campaign',
    Client = 'client',
    Deliverable = 'deliverable',
    /** @deprecated */
    Goal = 'goal',
    Media = 'media',
    Member = 'member',
    Post = 'post',
    PledgeEvent = 'pledge-event',
    Tier = 'tier',
    User = 'user',
    Webhook = 'webhook'
}

export type ItemType = `${Type}`

export interface ItemMap {
    address: Address
    benefit: Benefit
    campaign: Campaign
    client: OauthClient
    deliverable: Deliverable
    /** @deprecated */
    goal: Goal
    media: Media
    member: Member
    'pledge-event': PledgeEvent
    post: Post
    tier: Tier
    user: User
    webhook: Webhook
}

export interface Item<Type extends ItemType> {
    id: string
    type: Type
}

export type DataItem<Type extends ItemType, Related extends boolean = false> = {
    data: Item<Type>
} & If<Related, { link: { related: string } }, unknown>

export type DataItems<Type extends ItemType, Related extends boolean = false> = {
    data: Item<Type>[]
} & If<Related, { link: { related: string } }, unknown>

export interface AttributeItem<
    Type extends ItemType,
    Attributes extends Record<string, unknown> = Record<string, never>
> extends Item<Type> {
    attributes: Attributes;
}
