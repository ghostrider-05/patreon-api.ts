import { describe, expect, test } from 'vitest'

import { creatorClient, userClient } from '../../client'

import { QueryBuilder, Type } from '../../../v2'
import { PatreonOauthClient } from "../../../rest/v2/oauth2/client"

describe('oauth methods', () => {
    test('pagination', async () => {
        const paginator = creatorClient.paginateOauth2('/webhooks', QueryBuilder.webhooks.setRequestOptions({ count: 1 }))
        let total: number | null = null

        while (true) {
            const page = await paginator.next()
            if (page.done) {
                // TODO: test with cache
                // expect(page.value).toEqual(total)
                break
            }

            expect(page.value.data.every(d => d.type === Type.Webhook)).toBeTruthy()

            // TODO: test with cache
            // expect(page.value.data.length).toEqual(1)
            total ??= page.value.meta.pagination.total

            // TODO: test if data is unique
        }
    })
})

describe('oauth client', () => {
    const client = creatorClient

    test('client options', () => {
        expect(client.name).toBeNull()
        expect(client.oauth.userAgent).toBeTypeOf('string')

        client.name = 'new'
        expect(client.name).toEqual('new')
        expect(client.oauth['rest'].name).toEqual('new')
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
        expect(userClient.oauth.oauthUri).toBeTypeOf('string')

        expect(userClient.oauth.createOauthUri({
            scopes: [],
            state: 'state', 
        })).toBeTypeOf('string')

        userClient.oauth.options.redirectUri = undefined
        expect(() => userClient.oauth.createOauthUri({
            scopes: []
        })).toThrow()
    })

    test('validate scopes', () => {
        // no option set
        expect(() => client.oauth['validateScopes']('/webhooks', QueryBuilder.webhooks)).not.toThrowError()
        client.oauth.options.validateScopes = true
        expect(() => client.oauth['validateScopes']('/webhooks', QueryBuilder.webhooks)).not.toThrowError()

        // const userClient = createTestClient('user', async () => new Response())
        expect(() => userClient.oauth['validateScopes']('/webhooks', QueryBuilder.webhooks)).not.toThrowError()

        userClient.oauth.options.validateScopes = true
        expect(() => userClient.oauth['validateScopes']('/webhooks', QueryBuilder.webhooks)).toThrowError()

        userClient.oauth.options.scopes = ['w:campaigns.webhook']
        expect(() => userClient.oauth['validateScopes']('/webhooks', QueryBuilder.webhooks)).not.toThrowError()
    })

    test('validate token', async () => {
        client.oauth.options.validateToken = true

        expect(async () => await PatreonOauthClient['validateToken'](client.oauth, undefined)).not.toThrowError()
        expect(await PatreonOauthClient['validateToken'](client.oauth)).toEqual(client.oauth.cachedToken)

        client.oauth.cachedToken = undefined
        expect(await PatreonOauthClient['validateToken'](client.oauth).catch(() => undefined)).toBeUndefined()

        expect(await PatreonOauthClient['validateToken'](client.oauth, 'access_token')).toBeUndefined()
    })
})
