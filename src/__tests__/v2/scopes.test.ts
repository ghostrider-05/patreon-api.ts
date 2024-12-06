import { expect, describe, test } from 'vitest'

import { PatreonOauthScope, Routes, getRequiredScopes, createQuery } from '../../v2'

describe('oauth scopes', () => {
    describe('for path', () => {
        test('campaigns', () => {
            expect(getRequiredScopes.forPath(
                Routes.campaign(':id'),
                createQuery(new URLSearchParams())
            )).toEqual([PatreonOauthScope.Campaigns])
        })

        test('webhooks', () => {
            expect(getRequiredScopes.forPath(
                Routes.webhooks(),
                createQuery(new URLSearchParams())
            )).toEqual([PatreonOauthScope.ManageCampaignWebhooks])
        })

        test('posts', () => {
            expect(getRequiredScopes.forPath(
                Routes.post(':id'),
                createQuery(new URLSearchParams())
            )).toEqual([PatreonOauthScope.CampaignPosts])

            expect(getRequiredScopes.forPath(
                Routes.campaignPosts(':id'),
                createQuery(new URLSearchParams())
            )).toEqual([PatreonOauthScope.CampaignPosts])
        })

        test('members', () => {
            const query = createQuery(new URLSearchParams({
                include: 'address',
                'fields[user]': 'email',
            }))

            expect(getRequiredScopes.forPath(
                Routes.member(':id'),
                query
            )).toEqual([
                PatreonOauthScope.CampaignMembers,
                PatreonOauthScope.CampaignMembersEmail,
                PatreonOauthScope.CampaignMembersAdress,
            ])

            expect(getRequiredScopes.forPath(
                Routes.campaignMembers(':id'),
                query
            )).toEqual([
                PatreonOauthScope.CampaignMembers,
                PatreonOauthScope.CampaignMembersEmail,
                PatreonOauthScope.CampaignMembersAdress,
            ])
        })

        test('identity', () => {
            const query = createQuery(new URLSearchParams({
                include: 'campaign',
                'fields[user]': 'email',
            }))

            expect(getRequiredScopes.forPath(
                Routes.identity(),
                query
            )).toEqual([
                PatreonOauthScope.Identity,
                PatreonOauthScope.IdentityEmail,
                PatreonOauthScope.Campaigns,
            ])
        })
    })

    test('for attribute', () => {
        const memberScopes = getRequiredScopes.forAttributes({
            memberAddress: true,
            memberEmail: true,
        }, 'campaignMembers')

        expect(memberScopes).toEqual([
            PatreonOauthScope.CampaignMembers,
            PatreonOauthScope.CampaignMembersEmail,
            PatreonOauthScope.CampaignMembersAdress,
        ])

        const noMemberScopes = getRequiredScopes.forAttributes({}, 'member')

        expect(noMemberScopes).toEqual([
            PatreonOauthScope.CampaignMembers,
        ])

        const identityScopes = getRequiredScopes.forAttributes({
            userEmail: true,
            userMemberships: 'client',
            userOwnCampaign: true,
        }, 'identity')

        expect(identityScopes).toEqual([
            PatreonOauthScope.Identity,
            PatreonOauthScope.IdentityEmail,
            PatreonOauthScope.Campaigns,
        ])

        const allIdentityScopes = getRequiredScopes.forAttributes({
            userMemberships: 'all',
            userOwnCampaign: true,
        }, 'identity')

        expect(allIdentityScopes).toEqual([
            PatreonOauthScope.IdentityMemberships,
            PatreonOauthScope.Identity,
            PatreonOauthScope.Campaigns,
        ])

        const noIdentityScopes = getRequiredScopes.forAttributes({}, 'identity')

        expect(noIdentityScopes).toEqual([
            PatreonOauthScope.Identity,
        ])
    })
})
