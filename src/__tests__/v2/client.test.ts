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
    function createCreatorClientWithStore (body: object, status: number) {
        return createTestClient('creator', async () => {
            return new Response(JSON.stringify(body), { status })
        }, {
            async get() {
                return <never>{
                    access_token: 'stored',
                }
            },
            async put () {},
        })
    }

    const expires_in_epoch = (Date.now() + (5000 * 1000)).toString()

    const client = createTestClient('creator', async () => {
        return new Response(JSON.stringify({ access_token: 'token' }))
    }, {
        async get() {
            return <never>{
                access_token: 'stored',
                refresh_token: 'refresh',
                expires_in_epoch,
            }
        },
        async put () {},
    })

    test('app token: store', async () => {
        const token = await client.fetchApplicationToken()
        expect(token).toHaveProperty('success', true)
        expect(token).toHaveProperty('token', { access_token: 'token' })
    })

    test('stored token: get', async () => {
        const stored = await client.fetchStoredToken()
        
        expect(stored).toEqual({ access_token: 'stored', refresh_token: 'refresh', expires_in: '5000', expires_in_epoch })
    })

    test('stored token: put', async () => {
        await client.putStoredToken(<never>{ access_token: 'stored_2', expires_in: '6000', expires_in_epoch: '6000' }, true)
        expect(client.oauth.cachedToken).toEqual({ access_token: 'stored_2', expires_in: '6000', expires_in_epoch: '6000' })
    })

    test('app token: failed store', async () => {
        const clientWithoutStore = createTestClient('creator', async () => {
            return new Response(JSON.stringify({ access_token: 'token' }))
        })

        const token = await clientWithoutStore.fetchApplicationToken()

        expect(token).toHaveProperty('success', false)
        expect(token).toHaveProperty('token', undefined)
    })

    test('rest: invalid request', async () => {
        const client = createCreatorClientWithStore({ errors: [{ title: 'Invalid request'}] }, 400)

        const token = await client.fetchApplicationToken()
            .catch(() => ({ success: false, token: undefined }))

        expect(token).toHaveProperty('success', false)
        expect(token).toHaveProperty('token', undefined)
    })

    test('rest: ratelimited', async () => {
        const client = createCreatorClientWithStore({ errors: [{ title: 'Rate limited'}] }, 429)

        const token = await client.fetchApplicationToken()
            .catch(() => ({ success: false, token: undefined }))

        expect(token).toHaveProperty('success', false)
        expect(token).toHaveProperty('token', undefined)
    })

    test('rest: null response', async () => {
        let retries = 0
        const client = createTestClient('creator', async () => {
            if (retries) return new Response(JSON.stringify({ errors: [{ title: 'Invalid request'}] }), { status: 400 })
            else {
                retries += 1
                return null as unknown as Response
            }
        })

        const token = await client.fetchApplicationToken()
            .catch(() => ({ success: false, token: undefined }))

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

    test('member', async () => {
        const member = await client.fetchMember('id', buildQuery.member()(), { token: 'token' })
        const members = await client.fetchCampaignMembers('id', buildQuery.campaignMembers()(), { token: 'token' })

        expect(member).toEqual(data)
        expect(members).toEqual([data])
    })

    test('post', async () => {
        const post = await client.fetchPost('id', buildQuery.post()(), { token: 'token' })
        const posts = await client.fetchCampaignPosts('id', buildQuery.campaignPosts()(), { token: 'token' })

        expect(post).toEqual(data)
        expect(posts).toEqual([data])
    })

    test('post', async () => {
        const identity = await client.fetchIdentity(buildQuery.identity()(), { token: 'token' })

        expect(identity).toEqual(data)
    })
})