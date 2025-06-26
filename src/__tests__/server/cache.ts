import {
    PatreonMockData,
    Type,
    type CacheStoreOptions,
} from '../../v2'

type InitialCache = NonNullable<CacheStoreOptions['initial']>

const encoder = new TextEncoder()

export const data = new PatreonMockData({
    resources: {
        webhook: (id) => {
            return {
                secret: encoder.encode(id).join(''),
            }
        }
    }
})

const initialTestCache: InitialCache = [
    {
        id: data.createId(Type.Webhook),
        type: 'webhook',
        value: {
            item: {},
            relationships: {},
        }
    },
    {
        id: data.createId(Type.Webhook),
        type: 'webhook',
        value: {
            item: {},
            relationships: {},
        }
    },
    {
        id: data.createId(Type.Webhook),
        type: 'webhook',
        value: {
            item: {},
            relationships: {},
        }
    },
]

export default {
    initial: initialTestCache,
    requests: {
        mockAttributes: {
            webhook: {
                POST: (body) => {
                    const id = data.createId(Type.Webhook)

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
                }
            }
        }
    }
} satisfies CacheStoreOptions
