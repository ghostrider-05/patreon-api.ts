import { createHmac } from 'node:crypto'

import { PatreonWebhookTrigger, WebhookClient } from '../../../rest/v2/webhooks'
import { createBackoff, type RestRetriesOptions } from '../../../rest/v2/oauth2/rest/retries'

import type { WebhookPayload } from '../../../payloads/v2/'
import type { Webhook } from '../resources/webhook'

import { type PatreonMockCache } from './cache'
import { type PatreonMockData } from './data'

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
    /**
     * Additional headers to send on every mocked webhook request
     */
    headers?: Record<string, string>

    /**
     * The method to use when sending the mocked webhook request
     * @default 'POST'
     */
    method?: string

    /**
     * Options to retry failed webhook requests
     */
    retries?: Required<RestRetriesOptions>
}

interface PatreonMockWebhookQueuedMessage {
    body: string
    headers: Record<string, string>
    retries: number
    timer: NodeJS.Timeout
    last_attempted_at: string
}

interface PatreonMockWebhookStatus {
    signature: string
    success: boolean
    errors: number
    attempted_at: string
}

export class PatreonMockWebhooks {
    public queuedMessages: Map<string, PatreonMockWebhookQueuedMessage> = new Map()

    protected lastWebhookMessage: Map<string, PatreonMockWebhookStatus> = new Map()

    public constructor (
        public options: PatreonMockWebhooksOptions,
        protected data: PatreonMockData,
        protected cache: PatreonMockCache,
    ) {}

    public static getQueuedKey (webhookId: string, signature: string) {
        return webhookId + '/' + signature
    }

    public deleteQueuedMessage(webhookId: string, signature: string): boolean {
        const key = PatreonMockWebhooks.getQueuedKey(webhookId, signature)
        const item = this.queuedMessages.get(key)
        if (!item) return false

        clearTimeout(item.timer)
        return this.queuedMessages.delete(key) ?? false
    }

    public createSignature (secret: string, data: string): string {
        return createHmac('sha256', secret).update(data).digest('hex')
    }

    public createHeaders (data: PatreonMockWebhookHeaderData): Record<string, string> {
        return {
            [WebhookClient.headers.signature]: data.signature,
            [WebhookClient.headers.event]: data.event,
            ...this.data.createHeaders(data),
            ...(this.options.headers ?? {}),
        }
    }

    public createRequest <T extends PatreonWebhookTrigger>(
        webhook: Pick<Webhook, 'secret' | 'uri'>,
        event: T,
        data: WebhookPayload<T>,
    ): Request {
        const body = JSON.stringify(data)

        return new Request(webhook.uri, {
            method: 'POST',
            body,
            headers: this.createHeaders({
                event,
                signature: this.createSignature(webhook.secret, body),
            })
        })
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
        if (!this.options.retries) return

        const timer = setTimeout(async () => {
            const response = await fetch(webhook.uri, {
                method: this.options.method ?? 'POST',
                body,
                headers,
            })

            this.setWebhookStatus(webhook.id, {
                attempted_at: new Date().toISOString(),
                signature,
                success: response.ok,
                errors: response.ok ? 0 : ((this.lastWebhookMessage.get(webhook.id)?.errors ?? 0) + 1)
            })

            if (response.ok) {
                this.deleteQueuedMessage(webhook.id, signature)
                this.sendQueuedMessages(webhook)
            } else if (retries < (this.options.retries?.retries ?? 7)){
                this.retrySendingMessage(webhook, body, signature, headers, retries + 1)

                this.queuedMessages.set(PatreonMockWebhooks.getQueuedKey(webhook.id, signature), {
                    body,
                    headers,
                    retries,
                    timer,
                    last_attempted_at: new Date().toISOString(),
                })
            }
        }, retries === -1 ? 1 : createBackoff(this.options.retries.backoff)(retries))

        return timer
    }

    private setWebhookStatus (id: string, status: PatreonMockWebhookStatus): void {
        this.lastWebhookMessage.set(id, status)

        const cached = this.cache.get('webhook', id)
        if (cached != null) {
            this.cache.store.edit('webhook', id, {
                last_attempted_at: status.attempted_at,
                num_consecutive_times_failed: status.errors,
                paused: !status.success,
            })
        }
    }

    public sendQueuedMessage (
        webhook: Pick<Webhook, 'secret' | 'uri'> & { id: string },
        signature: string,
    ): boolean {
        const item = this.queuedMessages.get(PatreonMockWebhooks.getQueuedKey(webhook.id, signature))
        if (!item) return false

        const timer = this.retrySendingMessage(webhook, item.body, signature, item.headers, -1)
        return timer != undefined
    }

    public sendQueuedMessages (
        webhook: Pick<Webhook, 'secret' | 'uri'> & { id: string },
    ): boolean {
        const messages = this.queuedMessages.keys().filter(n => n.startsWith(webhook.id)).toArray()
        if (!messages || messages.length === 0) return false

        for (const [signature, { body, headers }] of this.queuedMessages.entries().filter(([key]) => key.startsWith(webhook.id))) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.retrySendingMessage(webhook, body, signature.split('/')[1]!, headers, -1)
        }

        return true
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
            method: this.options.method ?? 'POST',
            body,
            headers,
        })

        if (response.ok) {
            this.setWebhookStatus(webhook.id, {
                attempted_at: new Date().toISOString(),
                errors: 0,
                signature,
                success: true,
            })

            this.sendQueuedMessages(webhook)

            return response.status
        }

        const timer = this.retrySendingMessage(webhook, body, signature, headers, 1)
        if (timer != undefined) {
            this.queuedMessages.set(PatreonMockWebhooks.getQueuedKey(webhook.id, signature), {
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
