import { If } from '../../utils/generics'

import { Address } from './resources/address'
import { Benefit } from './resources/benefit'
import { Campaign } from './resources/campaign'
import { Deliverable } from './resources/deliverable'
import { Goal } from './resources/goal'
import { Media } from './resources/media'
import { Member } from './resources/member'
import { OauthClient } from './resources/oauth_client'
import { Post } from './resources/post'
import { PledgeEvent } from './resources/pledge_event'
import { Tier } from './resources/tier'
import { User } from './resources/user'
import { Webhook } from './resources/webhook'

export enum Type {
    Address = 'address',
    Benefit = 'benefit',
    Campaign = 'campaign',
    Client = 'client',
    Deliverable = 'deliverable',
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
