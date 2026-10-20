import { describe, expect, test } from 'vitest'

import {
    PatreonMock,
    QueryBuilder,
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
        const error = JSON.parse(mockedResponse.data! as string).errors[0]
        expect(error).toBeTypeOf('object')
        expect(error['status']).toEqual(statusCode.toString())
        console.log(error)
    })

    test('mock unknown route', async () => {
        const handler = client.getMockAgentReplyCallback()
        const mock = () => handler({ path: '/unknown-path', method: 'get' })

        expect(mock).toThrow()
    })
})

describe('mock data', () => {
    const client = new PatreonMock().data

    test('scrub id', () => {
        expect(client.scrub('fhoiqh203892h29')).toEqual('***************')
    })

    test('scrub invalid data', () => {
        expect(client.scrub(0)).toEqual(0)
    })

    test('scrub with replacer', () => {
        expect(client.scrub('12345', { replacer: '-' })).toEqual('-----')
        expect(client.scrub('12345', { replacer: () => '*' })).toEqual('*')
    })

    test.todo('scrub API route', () => {
        expect(RouteBases.oauth2 + Routes.identity()).toEqual(client.scrub(RouteBases.oauth2 + Routes.identity()))
        const campaignId = client.createId('campaign')
        expect(RouteBases.oauth2 + Routes.campaign('*'.repeat(campaignId.length))).toEqual(client.scrub(RouteBases.oauth2 + Routes.campaign(campaignId)))
    })

    test.todo('scrub API data', () => {
        const id = client.createId('campaign')
        const data = client.getSingleResponsePayload('campaign', QueryBuilder.campaign.includeAll(), {
            id,
            item: client.getAttributeItem('campaign', id).attributes,
            relatedItems: [],
        })
        const scrubbed = client.scrub(Object.freeze(data))

        expect(data.data.id).not.toEqual(scrubbed.data.id)
        expect(data.links.self).not.toEqual(scrubbed.links.self)
        // expect(data.data.id).not.toEqual(scrubbed.data.id)
    })
})
