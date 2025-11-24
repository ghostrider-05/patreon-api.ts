/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable jsdoc/require-jsdoc */
// #region mock-fn
import {
    type CacheStoreItem,
    PatreonCreatorClient,
    PatreonMock,
    Routes,
} from 'patreon-api.ts'
import { describe, expect, test, vi } from 'vitest'

// TODO: add members
const testMembers: CacheStoreItem<'member'>[] = []
const mock = new PatreonMock({
    cache: {
        initial: testMembers,
    },
})
const mockHandlers = mock.getMockHandlers({
    transformToResponse: true,
})

// Define a mock function for fetching the API
const mockFetch = vi.fn(async (url: string, _init?: RequestInit): Promise<Response> => {
    throw new Error('Fetch is not mocked for: ' + url)
})

// Use the mock function as the fetch method in your client
const testClient = new PatreonCreatorClient({
    oauth: {
        clientId: 'client_id',
        clientSecret: 'client_secret',
    },
    rest: {
        fetch: mockFetch,
    },
})

// The function to test and use in your app
async function fetchMemberCount (client: PatreonCreatorClient): Promise<number> {
    const response = await client.fetchCampaignMembers('my_campaign_id')
    return response.meta.pagination.total
}

describe('unit test fetchMemberCount', () => {
    test('return value is equal to the total', async () => {
        // Mock the expected response
        mockFetch.mockReturnValueOnce(mockHandlers.getCampaignMembers.handler({
            url: PatreonMock.route(Routes.campaignMembers('my_campaign_id')),
            headers: {},
        }))

        const members = await fetchMemberCount(testClient)
        expect(members).toEqual(testMembers.length)
    })
})
// #endregion mock-fn
