import {
    CacheItem,
    PatreonMockData,
    PatreonWebhookTrigger,
    Type,
    type CacheStoreOptions,
} from '../../v2'

type InitialCache = NonNullable<CacheStoreOptions['initial']>

const encoder = new TextEncoder()

export const mockData = new PatreonMockData({
    resources: {
        webhook: (id) => {
            return {
                secret: encoder.encode(id).join(''),
            }
        }
    },
    mockAttributes: {
        webhook: {
            POST: (body) => {
                const id = PatreonMockData.createId(Type.Webhook)

                return {
                    data: {
                        id,
                        type: Type.Webhook,
                        attributes: {
                            uri: body.data.attributes.uri,
                            triggers: body.data.attributes.triggers,
                            last_attempted_at: <never>null,
                            num_consecutive_times_failed: 0,
                            paused: false,
                            secret: encoder.encode(id).join(''),
                        },
                    },
                }
            },
        }
    }
})

export const testWebhook: CacheItem<'webhook'> = {
    item: {
        secret: 'secret',
        uri: 'https://patreon-api.pages.dev',
        last_attempted_at: new Date().toISOString(),
        num_consecutive_times_failed: 0,
        paused: false,
        triggers: [
            PatreonWebhookTrigger.PostPublished,
        ],
    },
    relationships: {
        campaign: 'campaign'
    }
}

const initialTestCache: InitialCache = [
    {
        id: '1234',
        type: 'webhook',
        value: testWebhook,
    },
    {
        id: mockData.createId(Type.Webhook),
        type: 'webhook',
        value: {
            item: {},
            relationships: {},
        }
    },
    {
        id: mockData.createId(Type.Webhook),
        type: 'webhook',
        value: {
            item: {},
            relationships: {},
        }
    },
    {
        id: mockData.createId(Type.Webhook),
        type: 'webhook',
        value: {
            item: {},
            relationships: {},
        }
    },
]

export default {
    initial: initialTestCache,
} satisfies CacheStoreOptions
