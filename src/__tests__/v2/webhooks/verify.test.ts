import { describe, expect, test } from 'vitest'

import {
    PatreonWebhookTrigger,
    parseWebhookRequest,
    verify,
} from '../../../v2'

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
