/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Routes } from '../../../../rest/v2/'

import type { Route } from '../types'

import campaign from './campaign'
import identity  from './identity'
import member from './member'
import post from './post'
import webhook from './webhook'

// TODO: not liking this to use random numbers
/**
 * For each route, more information about parameters and available methods
 */
export const RoutesData = {
    identity: identity.at(0)!,
    campaign: campaign.at(0)!,
    campaigns: campaign.at(1)!,
    campaignMembers: member.at(0)!,
    member: member.at(1)!,
    campaignPosts: post.at(0)!,
    post: post.at(1)!,
    webhook: webhook.at(0)!,
    webhooks: webhook.at(1)!,
} satisfies Record<keyof typeof Routes, Route>

// Use the same order of endpoints on the Patreon documentation
export default [
    ...identity,
    ...campaign,
    ...member,
    ...post,
    ...webhook,
] satisfies Route[]
