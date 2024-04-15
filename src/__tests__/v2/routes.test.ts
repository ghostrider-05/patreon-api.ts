import { expect, describe, test } from 'vitest'

import { Oauth2Routes } from '../../v2'

describe('oauth routes', () => {
    test('identity', () => {
        expect(Oauth2Routes.identity()).toEqual('/identity')
    })

    test('campaign', () => {
        expect(Oauth2Routes.campaign('test')).toEqual('/campaigns/test')
    })

    test('campaigns', () => {
        expect(Oauth2Routes.campaigns()).toEqual('/campaigns')
    })

    test('campaign members', () => {
        expect(Oauth2Routes.campaignMembers('test')).toEqual('/campaigns/test/members')
    })

    test('campaign posts', () => {
        expect(Oauth2Routes.campaignPosts('test')).toEqual('/campaigns/test/posts')
    })

    test('member', () => {
        expect(Oauth2Routes.member('user')).toEqual('/members/user')
    })

    test('post', () => {
        expect(Oauth2Routes.post('post')).toEqual('/posts/post')
    })
})
