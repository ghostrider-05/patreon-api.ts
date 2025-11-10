import { describe, expect, test } from 'vitest'

import { creatorClient } from '../../client'
import { QueryBuilder, Type } from '../../../v2'

describe('client methods', () => {
    test('campaigns', async () => {
        const campaign = await creatorClient.fetchCampaign('id', QueryBuilder.campaign, { token: 'token' })
        const campaigns = await creatorClient.fetchCampaigns(QueryBuilder.campaigns, { token: 'token' })

        expect(Array.isArray(campaigns.data)).toBeTruthy()
        expect(Array.isArray(campaign.data)).toBeFalsy()

        expect(campaign.data.type).toEqual(Type.Campaign)
        expect(campaigns.data.every(d => d.type === Type.Campaign)).toBeTruthy()
    })

    test('simplified campaigns', async () => {
        const campaign = await creatorClient.normalized.fetchCampaign('id', QueryBuilder.campaign, { token: 'token' })
        const campaigns = await creatorClient.normalized.fetchCampaigns(QueryBuilder.campaigns, { token: 'token' })

        expect(Array.isArray(campaigns.data)).toBeTruthy()
        expect(campaigns.data.every(d => d.type === Type.Campaign)).toBeTruthy()

        expect(campaign.id).toBeDefined()
        expect(campaign.type).toEqual(Type.Campaign)
    })

    test('members', async () => {
        const member = await creatorClient.fetchMember('id', QueryBuilder.member, { token: 'token' })
        const members = await creatorClient.fetchCampaignMembers('campaign', QueryBuilder.campaignMembers, { token: 'token' })

        expect(Array.isArray(members.data)).toBeTruthy()
        expect(Array.isArray(member.data)).toBeFalsy()

        expect(member.data.type).toEqual(Type.Member)
        expect(members.data.every(d => d.type === Type.Member)).toBeTruthy()
    })

    test('posts', async () => {
        const post = await creatorClient.fetchPost('id', QueryBuilder.post, { token: 'token' })
        const posts = await creatorClient.fetchCampaignPosts('campaign', QueryBuilder.campaignPosts, { token: 'token' })

        expect(Array.isArray(posts.data)).toBeTruthy()
        expect(Array.isArray(post.data)).toBeFalsy()

        expect(post.data.type).toEqual(Type.Post)
        expect(posts.data.every(d => d.type === Type.Post)).toBeTruthy()
    })

    test('identity', async () => {
        const identity = await creatorClient.fetchIdentity(QueryBuilder.identity, { token: 'token' })
    
        expect(identity.data.type).toEqual(Type.User)
    })
})
