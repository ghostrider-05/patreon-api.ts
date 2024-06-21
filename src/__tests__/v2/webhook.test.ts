import { describe, expect, test } from 'vitest'

import {
    PatreonWebhookTrigger,
    Type,
    parseWebhookRequest,
    verify,
    webhookToDiscordEmbed,
    type WebhookPayload,
    type WebhookToDiscordMessages,
} from '../../v2'

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