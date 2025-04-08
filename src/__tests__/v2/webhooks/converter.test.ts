import { describe, expect, test } from 'vitest'

import {
    PatreonWebhookTrigger,
    Type,
    webhookToDiscordEmbed,
    type WebhookPayload,
    type WebhookToDiscordMessages,
} from '../../../v2'

describe('webhook platforms', () => {
    // TODO: move to /schemas/
    const PostPublishedPayload: WebhookPayload<PatreonWebhookTrigger.PostPublished> = {
        links: { self: '' },
        data: {
            id: 'post-id',
            type: Type.Post,
            relationships: {
                campaign: { data: { id: 'campaign-id', type: Type.Campaign }, links: { related: '' } },
                user: { data: { id: 'user-id', type: Type.User }, links: { related: '' } },
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
                is_creator: true,
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