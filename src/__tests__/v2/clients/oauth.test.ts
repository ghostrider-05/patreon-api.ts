import { describe, expect, test } from 'vitest'

import { creatorClient, userClient } from '../../client'

import { QueryBuilder, Type } from '../../../v2'
import { PatreonOauthClient, type Oauth2CreatorToken, type Oauth2StoredToken } from "../../../rest/v2/oauth2/client"

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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cachedToken = creatorClient.oauth.cachedToken! as Oauth2CreatorToken | Oauth2StoredToken

    test('client options', () => {
        expect(creatorClient.name).toBeNull()
        expect(creatorClient.oauth.userAgent).toBeTypeOf('string')

        creatorClient.name = 'new'
        expect(creatorClient.name).toEqual('new')
        expect(creatorClient.oauth['rest'].name).toEqual('new')
        expect(creatorClient.rest.name).toEqual('new')

        expect(creatorClient.oauth.options.tokenType).toEqual('creator')
        expect(userClient.oauth.options.tokenType).toEqual('oauth')
    })

    test('util: is expired', () => {
        expect(PatreonOauthClient['isExpired'](cachedToken)).toBeFalsy()

        expect(PatreonOauthClient['isExpired'](<never>{
            expires_in_epoch: (Date.now() + 86000).toString(),
        }))
    })

    test('util: to stored', () => {
        expect(PatreonOauthClient['toStored'](cachedToken)).toEqual(creatorClient.oauth.cachedToken)

        expect(parseInt(PatreonOauthClient['toStored'](<never>{ expires_in: '600'}).expires_in_epoch)).approximately(Date.now() + 600_000, 20)
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
        expect(() => creatorClient.oauth['validateScopes']('/webhooks', QueryBuilder.webhooks)).not.toThrow()
        creatorClient.oauth.options.validateScopes = true
        expect(() => creatorClient.oauth['validateScopes']('/webhooks', QueryBuilder.webhooks)).not.toThrow()

        // const userClient = createTestClient('user', async () => new Response())
        expect(() => userClient.oauth['validateScopes']('/webhooks', QueryBuilder.webhooks)).not.toThrow()

        userClient.oauth.options.validateScopes = true
        expect(() => userClient.oauth['validateScopes']('/webhooks', QueryBuilder.webhooks)).toThrow()

        userClient.oauth.options.scopes = ['w:campaigns.webhook']
        expect(() => userClient.oauth['validateScopes']('/webhooks', QueryBuilder.webhooks)).not.toThrow()
    })

    test('validate token', async () => {
        creatorClient.oauth.options.validateToken = true

        // expect(async () => await creatorClient.oauth['validateToken'](undefined)).not.toThrow()
        // expect(await creatorClient.oauth['validateToken']()).toEqual(creatorClient.oauth.cachedToken)

        creatorClient.oauth.cachedToken = undefined
        expect(await creatorClient.oauth['validateToken']().catch(() => undefined)).toBeUndefined()

        expect(await creatorClient.oauth['validateToken']('access_token')).toEqual('access_token')
    })
})
