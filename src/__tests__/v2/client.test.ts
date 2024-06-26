import { describe, expect, test } from 'vitest'

import { PatreonCreatorClient, PatreonUserClient, type RestFetcher, buildQuery, PatreonTokenFetchOptions } from '../../v2'

import { PatreonOauthClient } from '../../rest/v2/oauth2/client'
import { If } from '../../utils/generics'

// TODO: expose this to be combined with testing client payloads
/**
 * Create a test client for Oauth
 * @param type the type of client to create
 * @param fetch the fetch function to use
 * @param store optional store options
 * @returns the created client
 */
export function createTestClient <T extends ('creator' | 'user')>(
    type: T,
    fetch: RestFetcher,
    store?: PatreonTokenFetchOptions
): If<T extends 'creator' ? true : false, PatreonCreatorClient, PatreonUserClient> {
    const instance = type === 'creator'
        ? () => PatreonCreatorClient
        : type === 'user'
            ? () => PatreonUserClient
            : () => { throw new Error('invalid type') }

    return <never>new (instance())({
        oauth: {
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'https://patreon.com/',
            token: {
                access_token: 'access_token',
                refresh_token: 'refresh_token',
            },
            validateToken: false,
        },
        store,
        rest: {
            fetch,
        }
    })
}

describe('oauth client', () => {
    const client = createTestClient('creator', async () => new Response())

    test('client options', () => {
        expect(client.name).toBeNull()
        expect(client.oauth.userAgent).toBeTypeOf('string')
    })

    test('util: is expired', () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(PatreonOauthClient.isExpired(client.oauth.cachedToken!)).toBeFalsy()

        expect(PatreonOauthClient.isExpired(<never>{
            expires_in_epoch: (Date.now() + 86000).toString(),
        }))
    })

    test('util: to stored', () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(PatreonOauthClient.toStored(client.oauth.cachedToken!)).toEqual(client.oauth.cachedToken)

        expect(parseInt(PatreonOauthClient.toStored(<never>{ expires_in: '600'}).expires_in_epoch)).approximately(Date.now() + 600_000, 20)
    })

    test('uri', () => {
        expect(client.oauth.oauthUri).toBeTypeOf('string')

        expect(client.oauth.createOauthUri({
            scopes: [],
            state: 'state', 
        })).toBeTypeOf('string')

        client.oauth.options.redirectUri = undefined
        expect(() => client.oauth.createOauthUri({
            scopes: []
        })).toThrow()
    })
})


describe('rest client', () => {
    const client = createTestClient('creator', async () => new Response())['rest']

    test('client', () => {
        expect(client.userAgent).toBeTypeOf('string')

        const headers = client.getHeaders(<never>{
            headers: new Headers({
                'x-patreon-sha': 'sha',
                'x-patreon-uuid': 'id',
            })
        })

        expect(headers).toHaveProperty('sha', 'sha')
        expect(headers).toHaveProperty('uuid', 'id')
    })
})

describe('creator client', () => {
    const client = createTestClient('creator', async () => {
        return new Response(JSON.stringify({ access_token: 'token' }))
    }, {
        async get() {
            return <never>{
                access_token: 'stored',
            }
        },
        async put () {},
    })

    test('app token: store', async () => {
        const token = await client.fetchApplicationToken()
        expect(token).toHaveProperty('success', true)
        expect(token).toHaveProperty('token', { access_token: 'token' })
    })

    test('app token', async () => {
        const clientWithoutStore = createTestClient('creator', async () => {
            return new Response(JSON.stringify({ access_token: 'token' }))
        })

        const token = await clientWithoutStore.fetchApplicationToken()

        expect(token).toHaveProperty('success', false)
        expect(token).toHaveProperty('token', undefined)
    })

    test('app token', async () => {
        const client = createTestClient('creator', async () => {
            return new Response(JSON.stringify({ errors: [{ title: 'Invalid request'}] }), { status: 400 })
        }, {
            async get() {
                return <never>{
                    access_token: 'stored',
                }
            },
            async put () {},
        })

        const token = await client.fetchApplicationToken()

        expect(token).toHaveProperty('success', false)
        expect(token).toHaveProperty('token', undefined)
    })
})

// TODO: replace data with actual payloads
describe('client methods', () => {
    const data = { type: 'client' }
    const client = createTestClient('creator', async (url) => {
        console.log('Url: ' + url)
        const payload = ['/members', '/campaigns', '/posts'].some(p => url.endsWith(p))
            ? [data]
            : data

        return new Response(JSON.stringify(payload))
    })
    
    test('campaigns', async () => {
        const campaign = await client.fetchCampaign('id', buildQuery.campaign()(), { token: 'token' })
        const campaigns = await client.fetchCampaigns(buildQuery.campaigns()(), { token: 'token' })


        expect(campaign).toEqual(data)
        expect(campaigns).toEqual([data])
    })
})