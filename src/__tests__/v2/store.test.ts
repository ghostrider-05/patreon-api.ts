import { expect, describe, test } from 'vitest'

import { PatreonStore } from '../../v2'

const values = new Map<string, string>()
    .set('test', 'value')
    .set('key', 'test')

describe('KV store', () => {
    let throwError = false

    const store = new PatreonStore.KV({
        get: (key) => new Promise((resolve) => {
            const value = values.get(key)
            if (!value && throwError) throw new Error()
            return resolve(value ?? null)
        }),
        put: (key, value) => new Promise(resolve => { values.set(key, value); resolve() }),
    }, 'token')

    test('unset value', async () => {
        expect(await store.get()).toBeUndefined()
        throwError = true
        expect(await store.get()).toBeUndefined()
    })

    test('update token', async () => {
        const token = {
            access_token: 'access',
            expires_in: '1200',
            expires_in_epoch: '10000',
            refresh_token: 'refresh',
            token_type: 'bearer',
        }

        await store.put(token)

        expect(await store.get()).toEqual(token)
    })
})

describe('Fetch store', () => {
    const store = new PatreonStore.Fetch('https://localhost:8000', async (url, options) => {
        if (options?.method === 'GET' || !options?.method) {
            const token = values.get('fetch_token')

            return new Response(token, {
                status: token ? 200 : 500,
            })
        } else if (options.method === 'PUT') {
            if (!options.body) return new Response('Invalid body', { status: 400 })

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            values.set('fetch_token', options.body!.toString())
            return new Response(null, {
                status: 201,
            })
        } else return new Response(null, { status: 400 })
    })

    test('use global fetch', () => {
        expect(new PatreonStore.Fetch('https://localhost:8000')).toBeDefined()
    })

    test('unset value', async () => {
        expect(await store.get()).toBeUndefined()
    })

    test('update token', async () => {
        const token = {
            access_token: 'access',
            expires_in: '1200',
            expires_in_epoch: '10000',
            refresh_token: 'refresh',
            token_type: 'bearer',
        }

        await store.put(token)

        expect(await store.get()).toEqual(token)
    })
})
