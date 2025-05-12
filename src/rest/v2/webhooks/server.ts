import { RestHeaders } from '../oauth2'

import { WebhookClient } from './client'
import { WebhookPayloadClient } from './payload'
import { PatreonWebhookTrigger } from './triggers'
import { verify } from './verify'

export type WebhookServerEventMap = {
    [T in PatreonWebhookTrigger]: [
        payload: WebhookPayloadClient<T>,
    ]
}

export interface WebhookServerOptions {
    secret: string | string[]
    cache?: string
    emitter?: NodeJS.EventEmitter<WebhookServerEventMap>
}

export class WebhookServer {
    public constructor (
        public options: WebhookServerOptions,
    ) {}

    public verify (signature: string | null, body: string): boolean
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    public verify (signature: RestHeaders, body: string): boolean
    public verify (signature: RestHeaders | string | null, body: string): boolean {
        const signatureStr = typeof signature === 'string' || signature == null
            ? signature
            : signature[WebhookClient.headers.signature]

        return Array.isArray(this.options.secret)
            ? this.options.secret.some(secret => verify(secret, signatureStr, body))
            : verify(this.options.secret, signatureStr, body)
    }
}
