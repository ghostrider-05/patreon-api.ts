import { expect, describe, test } from 'vitest'

import { PatreonOauthScope, Routes, getRequiredScopes, QueryBuilder } from '../../v2'

const query = QueryBuilder.fromParams(new URLSearchParams())

describe('oauth scopes', () => {
    describe('for path', () => {
        test('campaigns', () => {
            expect(getRequiredScopes.forPath(
                Routes.campaign(':id'),
                query
            )).toEqual([PatreonOauthScope.Campaigns])
        })

        test('webhooks', () => {
            expect(getRequiredScopes.forPath(
                Routes.webhooks(),
                query
            )).toEqual([PatreonOauthScope.ManageCampaignWebhooks])
        })

        test('posts', () => {
            expect(getRequiredScopes.forPath(
                Routes.post(':id'),
                query
            )).toEqual([PatreonOauthScope.CampaignPosts])

            expect(getRequiredScopes.forPath(
                Routes.campaignPosts(':id'),
                query
            )).toEqual([PatreonOauthScope.CampaignPosts])
        })

        test('members', () => {
            const query = QueryBuilder.fromParams(new URLSearchParams({
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
            const query = QueryBuilder.fromParams(new URLSearchParams({
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
