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
 * @param request The incoming request
 * @param secret The secret of the webhook to use for verifying the request
 * @throws if no secret is given
 * @throws if no event header is not found
 * @returns the parsed request body and event, or indicates if the verification has failed
 */
export async function parseWebhookRequest <
    Trigger extends PatreonWebhookTrigger = PatreonWebhookTrigger
>(request: Request, secret: string): Promise<
    | { verified: false, event: undefined, payload: undefined }
    | { verified: true, event: Trigger, payload: WebhookPayload<Trigger> }
>{
    const body = await request.clone().text()
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