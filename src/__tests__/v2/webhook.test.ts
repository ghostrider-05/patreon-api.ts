import { describe, expect, test } from 'vitest'

import {
    PatreonWebhookTrigger,
    Type,
    WebhookClient,
    WebhookPayloadClient,
    buildQuery,
    parseWebhookRequest,
    verify,
    webhookToDiscordEmbed,
    type Webhook,
    type WebhookPayload,
    type WebhookToDiscordMessages,
} from '../../v2'
import { createTestClient } from './client.test'

describe('webhook utilities', () => {
    describe('webhook verify', () => {
        test('invalid secret', () => {
            expect(() => {
                verify(<never>undefined, null, 'body')
            }).toThrowError()

            expect(() => {
                verify(<never>100, null, 'body')
            }).toThrowError()
        })

        test('verify signature', () => {
            expect(verify('secret', null, 'testing')).toEqual(false)
            expect(verify('secret', 'a964f51f0ae9c643aca91bfbc66f6d80', 'testing')).toEqual(false)

            expect(verify('secret', 'a964f51f0ae9c643aca91bfbc66f6d78', 'testing')).toEqual(true)
        })
    })

    describe('webhook parsing', () => {
        const validRequest = new Request('http://localhost:8000/callback', {
            method: 'POST',
            body: JSON.stringify({ data: { type: 'post' } }),
            headers: {
                'X-Patreon-Event': PatreonWebhookTrigger.PostPublished,
                'X-Patreon-Signature': '607ab2394f5c0de6f35b1aabecd0c851',
                'Content-Type': 'application/json',
            },
        })

        test('parse request', async () => {
            const result = await parseWebhookRequest<PatreonWebhookTrigger.PostPublished>(validRequest, 'secret')
            expect(result.verified).toEqual(true)
            expect(result.event).toEqual(PatreonWebhookTrigger.PostPublished)
            expect(result.payload).toBeDefined()
        })

        test('parse invalid request', async () => {
            const invalidRequest = validRequest.clone()
            invalidRequest.headers.set('X-Patreon-Signature', 'invalid')

            const result = await parseWebhookRequest(invalidRequest, 'secret')
            expect(result.verified).toEqual(false)
            expect(result.event).toBeUndefined()
            expect(result.payload).toBeUndefined()
        })

        test('parse invalid request (missing event header)', async () => {
            // Not needed to parse outcome, since the request must be valid before it throws
            expect(await (async () => {
                const result = await parseWebhookRequest(new Request('http://localhost:8000/callback', {
                    method: 'POST',
                    body: JSON.stringify({ data: { type: 'post' } }),
                    headers: {
                        // Disable this event header for the current test
                        // 'X-Patreon-Event': PatreonWebhookTrigger.PostPublished,
                        'X-Patreon-Signature': '607ab2394f5c0de6f35b1aabecd0c851',
                        'Content-Type': 'application/json',
                    },
                }), 'secret').catch((err) => {
                    console.error(err.message)
                    return err.message
                })

                return result
            })()).toEqual('failed to get event header from request for webhooks')
        })
    })
})

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
            const webhooks = await client.fetchWebhooks(query, { token: 'token' })

            expect(webhooks).toEqual([webhook])
        })

        test('edit webhooks', async () => {
            const res = await client.editWebhook({ id: 'id', paused: false }, { token: 'token' })

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
            }, { token: 'token' })

            expect(res).toEqual(webhook)
        })
    })
})

describe('webhook payload client', () => {
    describe('static utilities', () => {
        test('post typeguard', () => {
            expect(WebhookPayloadClient.isPostPayload(PatreonWebhookTrigger.PostPublished, <never>null)).toBeTruthy()
            expect(WebhookPayloadClient.isPostTrigger(PatreonWebhookTrigger.PostPublished)).toBeTruthy()
        })

        describe('attribute text', () => {
            test('undefined option', () => {
                expect(WebhookPayloadClient.createAttributeText(undefined, { title: undefined }, 'title', 'hello')).toEqual('hello')
                expect(WebhookPayloadClient.createAttributeText(undefined, { title: undefined }, 'title')).toEqual('')
                expect(WebhookPayloadClient.createAttributeText(undefined, { title: undefined })).toEqual('')
            })
    
            test('valid option', () => {
                expect(WebhookPayloadClient.createAttributeText('{{title}} is new', { title: null })).toEqual('{{title}} is new')
                expect(WebhookPayloadClient.createAttributeText('{{title}} is new', { title: 'Title' })).toEqual('Title is new')
            })
        })

        describe('convert', () => {
            const convert = WebhookPayloadClient.convert({
                default: {
                    title: '{{title}} is published',
                    color: 0,
                    footer: { text: 'Hello world' },
                    fields: [{
                        name: 'Is public',
                        value: '{{is_public}}',
                        inline: true,
                    }]
                }
            })

            test('posts', () => {
                expect(convert(PatreonWebhookTrigger.PostPublished, <never>{
                    data: { attributes: { title: 'Title', is_public: true } }
                })).toEqual({
                    title: 'Title is published',
                    color: 0,
                    footer: { text: 'Hello world' },
                    fields: [{ name: 'Is public', value: 'true', inline: true }]
                })
            })
        })
    })

    describe('payload', () => {
        test('user id', () => {
            const client = new WebhookPayloadClient(PatreonWebhookTrigger.PostPublished, <never>{
                data: { relationships: { user: { data: { id: 'user' } } } }
            })

            expect(client.userId).toEqual('user')
        })
    })
})

describe('webhook platforms', () => {
    // TODO: move to /schemas/
    const PostPublishedPayload: WebhookPayload<PatreonWebhookTrigger.PostPublished> = {
        links: { self: '' },
        data: {
            id: 'post-id',
            type: Type.Post,
            relationships: {
                campaign: { data: { id: 'campaign-id', type: Type.Campaign } },
                user: { data: { id: 'user-id', type: Type.User } },
            },
            attributes: {
                app_id: null,
                app_status: null,
                url: 'https://patreon.com',
                tiers: [],
                content: `This is a test post for testing webhooks`,
                title: 'Post title',
                published_at: new Date().toISOString(),
                is_public: false,
                is_paid: false,
                embed_data: null,
                embed_url: null,
            }
        },
        included: [
            { type: Type.User, id: 'user-id', attributes: {
                about: null,
                can_see_nsfw: false,
                created: new Date().toISOString(),
                email: '',
                first_name: null,
                full_name: 'Patreon Admin',
                hide_pledges: true,
                is_email_verified: true,
                like_count: 0,
                social_connections: {},
                last_name: null,
                url: 'https://patreon.com',
                image_url: '',
                thumb_url: '',
                vanity: 'admin',
            }}
        ]
    }

    describe('discord', () => {
        // TODO: add default messages
        const options: WebhookToDiscordMessages = {
            [PatreonWebhookTrigger.PostPublished]: {
                color: 123,
                title: 'New post: {title}',
                addContextKeys(payload) {
                    return {
                        title: payload.data.attributes.title ?? 'unknown',
                    }
                },
                author(patron) {
                    return patron ? {
                        icon_url: patron.thumb_url,
                        name: patron.full_name,
                        url: patron.url,
                    } : undefined
                },
                extends(payload) {
                    return {
                        description: payload.data.attributes.content ?? '',
                        url: payload.data.attributes.url,
                        fields: [
                            {
                                name: 'Public post',
                                value: payload.data.attributes.is_public ? 'Yes' : 'No'
                            }
                        ],
                    }
                },
            }
        }

        test('valid embed', () => {
            const embed = webhookToDiscordEmbed(PatreonWebhookTrigger.PostPublished, PostPublishedPayload, options)
            console.log(embed)
            expect(embed).toBeDefined()
        })

        test('missing trigger option', () => {
            const embed = webhookToDiscordEmbed(PatreonWebhookTrigger.PostDeleted, PostPublishedPayload, options)
            expect(embed).toBeUndefined()
        })
    })
})