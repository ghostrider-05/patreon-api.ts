import { createHmac } from 'node:crypto'

import { WebhookClient } from './client'
import type { PatreonWebhookTrigger } from './triggers'
import type { WebhookPayload } from '../../../payloads/v2/webhook'

/**
 * Verify an incoming webhook request
 * @param secret The webhook secret. Can be found in the portal or in the API response for client webhooks
 * @param signature The signature of the request. Can be found in the request headers
 * @param body The raw request body
 * @throws if no secret is given
 * @returns whether the signature is valid for the assiocated body
 */
export function verify (
    secret: string,
    signature: string | null,
    body: string,
) {
    if (secret == undefined || typeof secret !== 'string') throw new Error('No secret found')

    const hash = createHmac('md5', secret).update(body).digest('hex')
    return hash === signature
}

/**
 * Verify and parse the incoming Patreon webhook event
 * @param request The incoming request. Can be either:
 * - Node.js default request (v18+) / Undici request / request with `clone()` method implemented
 * - or a request without a `clone()` method. This function reads the request body and thus assumes that the body is not already read
 * and afterwards the body cannot be read again.
 * - HTTP Incoming message (like express) with a JSON parsed body.
 * @param secret The secret of the webhook to use for verifying the request
 * @throws if no secret is given
 * @throws if no event header is not found
 * @returns the parsed request body and event, or indicates if the verification has failed
 * @example The following examples on GitHub implement this method:
 * - express-webhook: for usage with express.js
 * - cloudflare-webhook: for usage with the Node.js Web API on cloudflare workers
 */
export async function parseWebhookRequest <
    Trigger extends PatreonWebhookTrigger = PatreonWebhookTrigger
>(
    request:
        | Pick<Request, 'headers' | 'body' | 'clone'>
        | Pick<Request, 'headers' | 'text'>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        | (import('http').IncomingMessage & { body: any }),
    secret: string
): Promise<
    | { verified: false, event: undefined, payload: undefined }
    | { verified: true, event: Trigger, payload: WebhookPayload<Trigger> }
>{
    const body = 'clone' in request && typeof request.clone === 'function'
        ? await request.clone().text()
        // TODO: do not this
        : ('text' in request && typeof request.text === 'function'
            ? await request.text()
            : JSON.stringify(request['body'])
        )
    const headers = WebhookClient.getWebhookHeaders(request.headers)

    const verified = verify(secret, headers.signature, body)
    if (!verified) {
        return {
            verified,
            event: undefined,
            payload: undefined,
        }
    }

    if (headers.event == null) throw new Error('failed to get event header from request for webhooks')

    return {
        event: <Trigger> headers.event,
        payload: JSON.parse(body) as WebhookPayload<Trigger>,
        verified: <const>true,
    }
}