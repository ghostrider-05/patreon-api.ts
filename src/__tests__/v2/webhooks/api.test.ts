import { describe, expect, test } from 'vitest'

import {
    WebhookClient,
    QueryBuilder,
    type Webhook,
} from '../../../v2'

import { creatorClient } from '../../client'

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
        const webhook = {
            data: {
                type: 'webhook',
                id: 'id',
                attributes: {},
            },
        }

        const client = creatorClient.webhooks

        test('fetch webhooks', async () => {
            const query = QueryBuilder.webhooks
            const webhooks = await client.fetchWebhooks(query)

            expect(webhooks.data[0].type).toEqual('webhook')
            console.log(webhooks)
        })

        test('edit webhooks', async () => {
            const res = await client.editWebhook({ id: 'id', paused: false })

            expect(res).toEqual(webhook)
        })

        test('unpause webhooks', async () => {
            const res = await client.unpauseWebhook('id', { token: 'token' })

            expect(res).toEqual(webhook)
        })

        test('pause webhooks', async () => {
            const res = await client.pauseWebhook('id', { token: 'token' })

            expect(res).toEqual(webhook)
        })

        test('create webhooks', async () => {
            const res = await client.createWebhook({
                campaignId: 'id',
                triggers: ['members:create'],
                uri: 'https://patreon-api.pages.dev/',
            })

            expect(res).toEqual(webhook)
        })

        test('delete a webhook', async () => {
            expect(async () => await client.deleteWebhook('id')).not.toThrowError()
        })
    })
})
