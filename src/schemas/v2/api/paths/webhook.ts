import {
    Oauth2Routes,
    RequestMethod,
    Type,
} from '../../../../v2'
import type { Route } from '../../../../utils/openapi'

const resource = Type.Webhook
const tags = [
    'webhook',
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
        route: Oauth2Routes.webhook,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Patch,
                id: 'editWebhook',
                body: patchWebhookBody,
            },
        ],
        params: {
            id: 'id',
        },
    },
    {
        route: Oauth2Routes.webhooks,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Get,
                id: 'getWebhooks',
            },
            {
                method: RequestMethod.Post,
                id: 'createWebhook',
                body: postWebhooksBody,
            },
        ],
        response: {
            array: true,
        },
    },
] satisfies Route[]
