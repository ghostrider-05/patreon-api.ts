import { PatreonMock, RouteBases, Routes } from 'patreon-api.ts'

const mock = new PatreonMock({
    cache: {
        initial: {
            campaign: new Map([
                ['my-campaign-id', {
                    item: {
                        patron_count: 7,
                        is_monthly: true,
                        // ... All other campaign attributes
                    },
                    relationships: {
                        creator: 'creator-id',
                        // If the campaign has benefits, goals or tiers
                        // Add these also the cache
                        benefits: [],
                        goals: [],
                        tiers: [],
                    }
                }],
            ]),
            user: new Map([
                ['creator-id', {
                    item: {
                        about: null,
                        is_creator: true,
                        // ... All other user attributes
                    },
                    relationships: {
                        campaign: 'my-campaign-id',
                        memberships: [],
                    },
                }]
            ])
        }
    }
})

export function getCachedCampaign () {
    return mock.getMockHandlers().getCampaign.handler({
        url: RouteBases.oauth2 + Routes.campaign('my-campaign-id'),
        headers: mock.data.createHeaders(),
    })
}