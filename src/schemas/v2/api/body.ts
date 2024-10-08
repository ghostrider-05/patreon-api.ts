import { PatreonWebhookTrigger } from '../../../v2'

export const postWebhooksBody = {
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
                            type: 'array',
                            enum: Object.values(PatreonWebhookTrigger)
                                .map(t => t.toString()),
                            examples: [
                                [
                                    PatreonWebhookTrigger.MemberPledgeCreated,
                                    PatreonWebhookTrigger.MemberUpdated,
                                    PatreonWebhookTrigger.MemberPledgeDeleted,
                                ],
                            ]
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

export const patchWebhookBody = {
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
