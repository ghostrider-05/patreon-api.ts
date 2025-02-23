import { createHmac, randomUUID } from 'node:crypto'

import { ResponseHeaders } from '../../../rest/v2/oauth2'
import { PatreonWebhookTrigger, WebhookClient } from '../../../rest/v2/webhooks'
import { Webhook, WebhookPayload } from '../../../v2'
import { createBackoff, RestRetriesBackoffOptions } from '../../../rest/v2/oauth2/rest'

interface PatreonMockWebhookHeaderData {
    signature: string
    event: PatreonWebhookTrigger
    uuid?: string
    sha?: string
    rayId?: string
    ratelimit?: {
        retryAfter: string
    }
}

export interface PatreonMockWebhooksOptions {
    headers?: Record<string, string>
    backoff?: RestRetriesBackoffOptions & {
        /**
         * @default 7
         */
        maxRetries?: number
    }
    queue?: {
        /**
         * @default 1000
         */
        limit?: number
        /**
         * @default 'webhook'
         */
        scope?: 'webhook' | 'global'
        jitter?: number
    }
}

export class PatreonMockWebhooks {
    public queuedMessages: Map<string, Map<string, {
        body: string
        headers: Record<string, string>
        retries: number
        timer: NodeJS.Timeout
        last_attempted_at: string
    }>> = new Map()

    protected lastWebhookMessage: Map<string, {
        signature: string
        success: boolean
        errors: number
        attempted_at: string
    }> = new Map()

    public constructor (
        public options: PatreonMockWebhooksOptions,
        protected createTestPayload: <T extends PatreonWebhookTrigger>(trigger: T) => WebhookPayload<T>,
    ) {}

    public deleteQueuedMessage(webhookId: string, signature: string): boolean {
        const item = this.queuedMessages.get(webhookId)?.get(signature)
        if (!item) return false

        clearTimeout(item.timer)
        return this.queuedMessages.get(webhookId)?.delete(signature) ?? false
    }

    public createSignature (secret: string, data: string): string {
        return createHmac('sha256', secret).update(data).digest('hex')
    }

    public createHeaders (data: PatreonMockWebhookHeaderData): Record<string, string> {
        return {
            [WebhookClient.headers.signature]: data.signature,
            [WebhookClient.headers.event]: data.event,
            [ResponseHeaders.UUID]: data.uuid ?? randomUUID(),
            [ResponseHeaders.CfCacheStatus]: 'DYNAMIC',
            [ResponseHeaders.Sha]: data.sha ?? '',
            [ResponseHeaders.CfRay]: data.rayId ?? '',
            ...(data.ratelimit != undefined ? {
                [ResponseHeaders.RetryAfter]: data.ratelimit.retryAfter,
            } : {}),
            'Content-Type': 'application/json',
            ...(this.options.headers ?? {}),
        }
    }

    public getWebhook (webhookId: string): Pick<Webhook,
        | 'last_attempted_at'
        | 'paused'
        | 'num_consecutive_times_failed'
    > {
        const lastMessage = this.lastWebhookMessage.get(webhookId)

        return {
            paused: lastMessage?.success ? false : true,
            num_consecutive_times_failed: lastMessage?.errors ?? 0,
            last_attempted_at: lastMessage?.attempted_at ?? new Date().toISOString(),
        }
    }

    private retrySendingMessage (
        webhook: Pick<Webhook, 'secret' | 'uri'> & { id: string },
        body: string,
        signature: string,
        headers: Record<string, string>,
        retries: number,
    ): NodeJS.Timeout | undefined {
        if (!this.options.backoff) return

        const timer = setTimeout(async () => {
            const response = await fetch(webhook.uri, {
                method: 'POST',
                body,
                headers,
            })

            this.lastWebhookMessage.set(webhook.id, {
                attempted_at: new Date().toISOString(),
                signature,
                success: response.ok,
                errors: response.ok ? 0 : ((this.lastWebhookMessage.get(webhook.id)?.errors ?? 0) + 1)
            })

            if (response.ok) {
                this.deleteQueuedMessage(webhook.id, signature)
                this.sendQueuedMessages(webhook)
            } else if (retries < (this.options.backoff?.maxRetries ?? 7)){
                this.retrySendingMessage(webhook, body, signature, headers, retries + 1)

                this.queuedMessages.get(webhook.id)?.set(signature, {
                    body,
                    headers,
                    retries,
                    timer,
                    last_attempted_at: new Date().toISOString(),
                })
            }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        }, retries === -1 ? 0 : createBackoff(this.options.backoff!)(retries))

        return timer
    }

    public sendQueuedMessage (
        webhook: Pick<Webhook, 'secret' | 'uri'> & { id: string },
        signature: string,
    ): boolean {
        const item = this.queuedMessages.get(webhook.id)?.get(signature)
        if (!item) return false

        const timer = this.retrySendingMessage(webhook, item.body, signature, item.headers, -1)
        return timer != undefined
    }

    public sendQueuedMessages (
        webhook: Pick<Webhook, 'secret' | 'uri'> & { id: string },
    ): boolean {
        const messages = this.queuedMessages.get(webhook.id)
        if (!messages || messages.size === 0) return false

        for (const [signature, { body, headers }] of messages) {
            this.retrySendingMessage(webhook, body, signature, headers, -1)
        }

        return true
    }

    public async sendTestPayload <T extends PatreonWebhookTrigger>(
        webhook: Pick<Webhook, 'secret' | 'uri'> & { id: string },
        event: T
    ): Promise<number | null> {
        return await this.send(webhook, event, this.createTestPayload(event))
    }

    public async send <T extends PatreonWebhookTrigger>(
        webhook: Pick<Webhook, 'secret' | 'uri'> & { id: string },
        event: T,
        data: WebhookPayload<T>,
    ): Promise<number | null> {
        const body = JSON.stringify(data)

        const signature = this.createSignature(webhook.secret, body)
        const headers = this.createHeaders({
            event,
            signature,
        })

        const response = await fetch(webhook.uri, {
            method: 'POST',
            body,
            headers,
        })

        if (response.ok) {
            this.lastWebhookMessage.set(webhook.id, {
                attempted_at: new Date().toISOString(),
                errors: 0,
                signature,
                success: true,
            })

            this.sendQueuedMessages(webhook)

            return response.status
        }

        if (!this.queuedMessages.has(webhook.id)) {
            this.queuedMessages.set(webhook.id, new Map())
        }

        if (this.options.queue != undefined) {
            const size = this.options.queue.scope === 'global'
                ? this.queuedMessages.values().reduce((size, m) => size + m.size, 0)
                : this.queuedMessages.get(webhook.id)?.size ?? 0

            if (size > (this.options.queue.limit ?? 1000)) {
                console.warn('Not keeping message in queue')

                return response.status
            }
        }

        const timer = this.retrySendingMessage(webhook, body, signature, headers, 1)
        if (timer != undefined) {
            this.queuedMessages.get(webhook.id)?.set(signature, {
                body,
                headers,
                retries: 0,
                timer,
                last_attempted_at: new Date().toISOString(),
            })

            return null
        }

        return null
    }
}
