import { describe, expect, test } from 'vitest'

import {
    PatreonMock,
    RouteBases,
    Routes,
} from '../../../v2'

describe('Mock client', () => {
    const client = new PatreonMock()

    test('returns mock handlers', () => {
        const handlers = client.getMockHandlers()
        const { getIdentity } = handlers

        expect(getIdentity.method).toEqual('get')
        expect(getIdentity.url).toEqual('https://patreon.com/api/oauth2/v2/identity')
    })

    test('returns mock handlers without origin', () => {
        const handlers = client.getMockHandlers({ includeOrigin: false })
        const { getIdentity } = handlers

        expect(getIdentity.method).toEqual('get')
        expect(getIdentity.url).toEqual('/api/oauth2/v2/identity')
    })

    test('returns unknown cache response option', async () => {
        const handlers = client.getMockHandlers({ cache: false, random: false })
        const { getIdentity } = handlers

        const mockResponse = await getIdentity.handler({
            url: RouteBases.oauth2 + Routes.identity(),
            headers: client.data.createHeaders(),
        })

        expect(mockResponse.body).toEqual('')
    })

    test('returns unknown cache response option for a list response', async () => {
        const handlers = client.getMockHandlers({ cache: false, random: false })
        const { getCampaigns } = handlers

        const mockResponse = await getCampaigns.handler({
            url: RouteBases.oauth2 + Routes.campaigns(),
            headers: client.data.createHeaders(),
        })

        expect(mockResponse.body).toEqual('')
    })

    test('returns mocked url with path param', async () => {
        const handlers = client.getMockHandlers({ pathParam: '{id}' })
        const { getCampaign } = handlers

        expect(getCampaign.url).toEqual(RouteBases.oauth2 + Routes.campaign('{id}'))
    })

    test('returns mocked error', async () => {
        const statusCode = 400
        const handler = client.getMockAgentReplyCallback({ statusCode })
        const mockedResponse = handler({ path: Routes.campaigns(), method: 'get' })

        expect(mockedResponse.statusCode).toEqual(statusCode)

        expect(mockedResponse.data).toBeDefined()
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const error = JSON.parse(mockedResponse.data!).errors[0]
        expect(error).toBeTypeOf('object')
        expect(error['status']).toEqual(statusCode.toString())
        console.log(error)
    })
})
