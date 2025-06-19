import { PatreonMock, RouteBases, Routes } from 'patreon-api.ts'

const mock = new PatreonMock({
    cache: {
        initial: [
            {
                type: 'campaign',
                id: 'my-campaign-id',
                value: {
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
                        // If no relationship is configured for this item
                        // Use null instead of an array / empty string
                        goals: null,
                    },
                }
            },
            {
                id: 'creator-id',
                type: 'user',
                value: {
                    item: {
                        about: null,
                        is_creator: true,
                        // ... All other relevant user properties
                    },
                    relationships: {
                        campaign: 'my-campaign-id',
                    }
                }
            }
        ],
    }
})

export function getCachedCampaignResponse () {
    return mock.getMockHandlers().getCampaign.handler({
        url: RouteBases.oauth2 + Routes.campaign('my-campaign-id'),
        headers: mock.data.createHeaders(),
    })
}