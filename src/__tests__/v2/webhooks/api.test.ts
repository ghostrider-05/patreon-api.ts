import { describe, expect, test } from 'vitest'

import {
    WebhookClient,
    buildQuery,
    type Webhook,
} from '../../../v2'

import { createTestClient } from '../client.test'

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
        const webhook: Partial<Webhook> = {
            num_consecutive_times_failed: 0,
        }

        const webhookClient = new WebhookClient(<never>{})

        expect(webhookClient.hasUnsentEvents(<Webhook>webhook)).toBeFalsy()
    })

    describe('webhook API', () => {
        const webhook = { type: 'webhook', id: 'id', attributes: {} }
        const client = createTestClient('creator', async (_, { method }) => {
            return new Response(JSON.stringify(method === 'GET' ? [webhook] : webhook), { status: 200 })
        }).webhooks

        test('fetch webhooks', async () => {
            const query = buildQuery.webhooks()()
            const webhooks = await client.fetchWebhooks(query)

            expect(webhooks).toEqual([webhook])
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
                uri: 'https://patreon-api.pages/',
            })

            expect(res).toEqual(webhook)
        })

        test('delete a webhook', async () => {
            expect(async () => await client.deleteWebhook('id')).not.toThrowError()
        })
    })
})
