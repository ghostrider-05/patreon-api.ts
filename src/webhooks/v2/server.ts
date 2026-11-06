import { type RestHeaders } from '../../oauth/v2/'
import { resolveHeaders } from '../../oauth/v2/rest/headers'

import {
    CacheStore,
    CacheStoreShared,
    type CacheStoreBinding,
    type CacheStoreItem,
    type CacheStoreOptions,
    type ItemType,
} from '../../schemas/v2'
import { WebhookPayload } from '../../v2'

import { WebhookClient } from './client'
import { WebhookPayloadClient } from './payload'
import { PatreonWebhookTrigger } from './triggers'
import { parseWebhookRequest, verify } from './verify'

export type WebhookServerEventMap = {
    [T in PatreonWebhookTrigger]: [
        event: WebhookPayloadClient<T>,
    ]
}

interface WebhookServerCacheOptions<AsyncCache extends boolean = boolean> extends CacheStoreOptions {
    binding: CacheStoreBinding<AsyncCache, CacheStoreItem<ItemType>>
    // TODO: add async property on binding
    async: AsyncCache
}

export interface WebhookServerOptions<AsyncCache extends boolean = boolean> {
    secret: string | string[]
    cache?: WebhookServerCacheOptions<AsyncCache>
    events?: NodeJS.EventEmitter<WebhookServerEventMap>
}

export class WebhookServer<AsyncCache extends boolean = boolean> {
    public cache: CacheStore<AsyncCache> | null = null
    public eventsCache: CacheStoreShared<false, {
        [T in PatreonWebhookTrigger]: { trigger: T, payload: WebhookPayload<T> }
    }[PatreonWebhookTrigger]> | null = null

    public constructor (
        public options: WebhookServerOptions<AsyncCache>,
    ) {
        if (options.cache) {
            const { async, binding, ...cacheOptions } = options.cache
            this.cache = new CacheStore(async, binding, cacheOptions)

            this.eventsCache = new CacheStoreShared(false, undefined, cacheOptions)
        }
    }

    private get secrets (): string[] {
        return Array.isArray(this.options.secret)
            ? this.options.secret
            : [this.options.secret]
    }

    public verify (signature: string | null, body: string): boolean
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    public verify (signature: RestHeaders, body: string): boolean
    public verify (signature: RestHeaders | string | null, body: string): boolean {
        const signatureStr = typeof signature === 'string' || signature == null
            ? signature
            : resolveHeaders(signature)[WebhookClient.headers.signature] ?? null

        return this.secrets.some(secret => verify(secret, signatureStr, body))
    }

    public async handleRequest (
        request: Parameters<typeof parseWebhookRequest>[0],
    ): Promise<boolean> {
        for (const secret of this.secrets) {
            const result = await parseWebhookRequest(request, secret)
            if (!result.verified) continue

            const payload = new WebhookPayloadClient(result.event, result.payload)
            this.options.events?.emit<PatreonWebhookTrigger>(
                result.event,
                // Typecast to one trigger to use type safety on the event payload
                payload as WebhookPayloadClient<PatreonWebhookTrigger.MemberCreated>,
            )
            // TODO: sync with cache?
            // await this.cache.syncWebhook(payload)
            // TODO: what is this key?
            this.eventsCache?.put(Date.now().toString(), {
                trigger: result.event as PatreonWebhookTrigger.MemberCreated,
                payload: result.payload as WebhookPayload<PatreonWebhookTrigger.MemberCreated>,
            })

            return true
        }

        return false
    }
}
