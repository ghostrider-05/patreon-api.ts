import { describe, expect, test } from 'vitest'

import { PatreonCreatorClient, PatreonUserClient, type RestFetcher, PatreonTokenFetchOptions, QueryBuilder } from '../../v2'

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
    test('pagination', async () => {
        const webhooks = Array.from({ length: 4 }, (_, id) => ({ type: 'webhook', id: id.toString() }))
        const client = createTestClient('creator', async (url) => {
            const { searchParams } = new URL(url)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const cursor = parseInt(searchParams.get('page[cursor]') ?? '0'), count = parseInt(searchParams.get('page[count]')!)
            return new Response(JSON.stringify({
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                data: webhooks.slice(cursor, cursor + count),
                meta: {
                    pagination: {
                        total: webhooks.length,
                        cursors: {
                            next: (cursor + count) > webhooks.length ? null : (cursor + count).toString(),
                        }
                    }
                }
            }))
        })

        const paginator = client.paginateOauth2('/webhooks', QueryBuilder.webhooks.setRequestOptions({ count: 1 }))

        expect(await paginator.next()).toEqual({
            done: false,
            value: {
                data: [{ id: '0', type: 'webhook' }],
                meta: { pagination: { total: 4, cursors: { next: '1' } } },
            }
        })

        expect(await paginator.next()).toEqual({
            done: false,
            value: {
                data: [{ id: '1', type: 'webhook' }],
                meta: { pagination: { total: 4, cursors: { next: '2' } } },
            }
        })

        expect(await paginator.next()).toEqual({
            done: false,
            value: {
                data: [{ id: '2', type: 'webhook' }],
                meta: { pagination: { total: 4, cursors: { next: '3' } } },
            }
        })

        expect(await paginator.next()).toEqual({
            done: false,
            value: {
                data: [{ id: '3', type: 'webhook' }],
                meta: { pagination: { total: 4, cursors: { next: '4' } } },
            }
        })

        expect(await paginator.next()).toEqual({
            done: true,
            value: 4
        })
    })
})

describe('creator client', () => {
    // eslint-disable-next-line jsdoc/require-jsdoc
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

        const result = await client.initialize()
        expect(result).toEqual(token.success)
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

describe('user client', () => {
    const client = createTestClient('user', async (url) => {
        const { pathname } = new URL(url)
        if (pathname.endsWith('/token')) return new Response(JSON.stringify({
            access_token: 'stored',
            refresh_token: 'refresh',
            expires_in: '6000',
        }))

        if (pathname.endsWith('/identity')) return new Response(JSON.stringify({
            data: {
                attributes: { social_connections: { discord: { user_id: 'discord_id' } } }
            }
        }))

        return new Response(null, { status: 400 })
    })

    test('user instance', async () => {
        const url = 'https://patreon-api.pages.dev/token?code=code'

        const instance = await client.createInstance(url)
        expect(instance).toBeDefined()

        const instance2 = await client.createInstance({ url })
        expect(instance2).toBeDefined()

        expect(await (async function () {
            return await client.createInstance(<never>{ url: undefined })
                .catch(() => undefined)
        })()).toBeUndefined()
    })

    test('throws on creating instance', async () => {
        // Url is invalid because it does not have a code param
        const invalidUrl = 'https://patreon.com/?state=2039fg30'

        expect(await (async function () {
            return await client.createInstance(invalidUrl)
                .catch(() => undefined)
        })()).toBeUndefined()
    })

    test('user discord id', async () => {
        const url = 'https://patreon-api.pages.dev/token?code=code'

        const instance = await client.createInstance(url)
        const discordId = await instance.fetchDiscordId()

        expect(discordId).toEqual('discord_id')
    })
})
