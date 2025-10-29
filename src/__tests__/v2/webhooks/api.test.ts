import { describe, expect, test } from 'vitest'

import {
    WebhookClient,
    QueryBuilder,
    type Webhook,
} from '../../../v2'

import { creatorClient } from '../../client'
import { testWebhook } from '../../server/cache'

describe('webhook client', () => {
    test('webhook headers', () => {
        const headers = new Headers({
            [WebhookClient.headers.event]: 'event',
            [WebhookClient.headers.signature]: 'signature'
        })

        expect(WebhookClient.getWebhookHeaders(headers)).toHaveProperty('event', 'event')
        expect(WebhookClient.getWebhookHeaders(headers)).toHaveProperty('signature', 'signature')
    })

    test('webhook paused', () => {
        const webhook: Webhook = {
            num_consecutive_times_failed: 0,
            paused: false,
            triggers: [],
            uri: 'https://ghostrider-05.com',
            secret: 'htoihweowjewokpkpw.whfowhrowj',
            last_attempted_at: new Date().toISOString(),
        }

        const webhookClient = new WebhookClient(creatorClient.oauth)

        expect(webhookClient.hasUnsentEvents(webhook)).toBeFalsy()
    })

    describe('webhook API', () => {
        const id = '1234'
        const baseWebhook = {
            data: {
                type: 'webhook',
                id,
                attributes: testWebhook.item,
            },
        }

        const pausedWebhook = {
            data: {
                type: 'webhook',
                id,
                attributes: { ...testWebhook.item, paused: true },
            },
        }

        const client = creatorClient.webhooks

        test('fetch webhooks', async () => {
            const query = QueryBuilder.webhooks
            const webhooks = await client.fetchWebhooks(query)

            expect(webhooks.data[0].type).toEqual('webhook')
            console.log(webhooks)
        })

        // TODO: remove fails
        test('edit webhooks', { fails: true }, async () => {
            const res = await client.editWebhook({ id, paused: true })

            expect(res).toEqual(pausedWebhook)
        })

        test('unpause webhooks', { fails: true }, async () => {
            const res = await client.unpauseWebhook(id, { token: 'token' })

            expect(res).toEqual(baseWebhook)
        })

        test('pause webhooks', { fails: true }, async () => {
            const res = await client.pauseWebhook(id, { token: 'token' })

            expect(res).toEqual(pausedWebhook)
        })

        test('create webhooks', { fails: true }, async () => {
            const res = await client.createWebhook({
                campaignId: 'campaign',
                triggers: ['posts:publish'],
                uri: 'https://patreon-api.pages.dev',
            })

            expect(res).toEqual(baseWebhook)
        })

        // test('delete a webhook', { fails: true }, async () => {
        //     expect(async () => await client.deleteWebhook(id)).not.toThrowError()
        // })
    })
})
