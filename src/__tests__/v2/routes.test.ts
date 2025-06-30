import { expect, describe, test } from 'vitest'

import { Routes } from '../../v2'

describe('routes', () => {
    test('identity', () => {
        expect(Routes.identity()).toEqual('/identity')
    })

    test('campaign', () => {
        expect(Routes.campaign('test')).toEqual('/campaigns/test')
    })

    test('campaigns', () => {
        expect(Routes.campaigns()).toEqual('/campaigns')
    })

    test('campaign members', () => {
        expect(Routes.campaignMembers('test')).toEqual('/campaigns/test/members')
    })

    test('campaign posts', () => {
        expect(Routes.campaignPosts('test')).toEqual('/campaigns/test/posts')
    })

    test('member', () => {
        expect(Routes.member('user')).toEqual('/members/user')
    })

    test('post', () => {
        expect(Routes.post('post')).toEqual('/posts/post')
    })

    test('webhook', () => {
        expect(Routes.webhook('hook')).toEqual('/webhooks/hook')
    })

    test('webhooks', () => {
        expect(Routes.webhooks()).toEqual('/webhooks')
    })
})
