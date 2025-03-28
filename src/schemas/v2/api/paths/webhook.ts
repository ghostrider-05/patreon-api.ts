import {
    Routes,
    PatreonOauthScope,
    RequestMethod,
} from '../../../../rest/v2/'

import { Type } from '../../item'
import type { Route } from '../types'

const resource = Type.Webhook
const tags = [
    'Webhooks',
]

const postWebhooksBody = {
    required: [
        'data',
    ],
    properties: {
        data: {
            required: [
                'type',
                'attributes',
                'relationships',
            ],
            properties: {
                type: {
                    type: 'string',
                    enum: ['webhook'],
                },
                attributes: {
                    required: [
                        'triggers',
                        'uri',
                    ],
                    properties: {
                        triggers: {
                            '$ref': '#/components/schemas/webhookTrigger',
                        },
                        uri: {
                            type: 'string',
                            description: 'Fully qualified uri where webhook will be sent',
                            examples: [
                                'https://www.example.com/webhooks/incoming',
                            ],
                        }
                    }
                },
                relationships: {
                    properties: {
                        campaign: {
                            properties: {
                                data: {
                                    required: [
                                        'type',
                                        'id',
                                    ],
                                    properties: {
                                        type: {
                                            type: 'string',
                                            enum: ['campaign'],
                                        },
                                        id: {
                                            type: 'string',
                                            examples: [
                                                'campaign-id',
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

const patchWebhookBody = {
    required: ['data'],
    properties: {
        data: {
            required: [
                'attributes',
                'type',
                'id',
            ],
            properties: {
                type: postWebhooksBody.properties.data.properties.type,
                id: {
                    type: 'string',
                    examples: [
                        'webhook-id',
                    ]
                },
                attributes: {
                    required: [],
                    properties: {
                        ...postWebhooksBody.properties.data.properties.attributes.properties,
                        paused: {
                            type: 'boolean',
                            examples: [false],
                        },
                    },
                }
            }
        }
    }
}

export default [
    {
        route: Routes.webhook,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Patch,
                id: <const>'editWebhook',
                body: patchWebhookBody,
            },
            {
                method: RequestMethod.Delete,
                id: <const>'deleteWebhook',
                experimental: true,
                responseStatus: 204,
            },
        ],
        params: {
            id: 'id',
        },
        scopes: [
            PatreonOauthScope.ManageCampaignWebhooks,
        ],
    },
    {
        route: Routes.webhooks,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Get,
                id: <const>'getWebhooks',
            },
            {
                method: RequestMethod.Post,
                id: <const>'createWebhook',
                body: postWebhooksBody,
            },
        ],
        response: {
            array: true,
        },
        scopes: [
            PatreonOauthScope.ManageCampaignWebhooks,
        ],
    },
] satisfies Route[]
