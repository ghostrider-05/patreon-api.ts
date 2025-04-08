import { describe, expect, test } from 'vitest'

import {
    PatreonWebhookTrigger,
    WebhookPayloadClient,
} from '../../../v2'

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

        describe('convert default', () => {
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

        describe('convert post published', () => {
            const convert = WebhookPayloadClient.convert({
                posts: {
                    "posts:publish": {
                        title: '{{title}} is published',
                        color: 0,
                        footer: { text: 'Hello world' },
                        fields: [{
                            name: 'Is public',
                            value: '{{is_public}}',
                            inline: true,
                        }]
                    }
                }
            })

            test('posts published', () => {
                expect(convert(PatreonWebhookTrigger.PostPublished, <never>{
                    data: { attributes: { title: 'Title', is_public: true } }
                })).toEqual({
                    title: 'Title is published',
                    color: 0,
                    footer: { text: 'Hello world' },
                    fields: [{ name: 'Is public', value: 'true', inline: true }]
                })
            })

            test('invalid trigger', () => {
                expect(convert(PatreonWebhookTrigger.PostUpdated, <never>{
                    data: { attributes: { title: 'Title', is_public: true } }
                })).toEqual({})

                expect(convert(PatreonWebhookTrigger.MemberCreated, <never>{
                    data: { attributes: { full_name: 'Patreon user' } }
                })).toEqual({})
            })
        })
    })

    describe('payload', () => {
        test('user', () => {
            const client = new WebhookPayloadClient(PatreonWebhookTrigger.PostPublished, <never>{
                data: { relationships: { user: { data: { id: 'user' } } } },
                included: [
                    {
                        type: 'user',
                        id: 'user',
                        attributes: {
                            full_name: 'Patreon user',
                        }
                    }
                ]
            })

            expect(client.userId).toEqual('user')
            expect(client.user?.attributes).toEqual({ full_name: 'Patreon user' })
        })

        test('campaign', () => {
            const client = new WebhookPayloadClient(PatreonWebhookTrigger.PostPublished, <never>{
                data: { relationships: { campaign: { data: { id: 'campaign' } } } },
                included: [
                    {
                        type: 'campaign',
                        id: 'campaign',
                        attributes: {
                            patron_count: 12,
                        }
                    }
                ]
            })

            expect(client.campaignId).toEqual('campaign')
            expect(client.campaign?.attributes).toEqual({ patron_count: 12 })
        })
    })
})
