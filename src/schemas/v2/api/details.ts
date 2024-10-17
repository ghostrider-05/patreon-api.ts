import { APIVersion } from '../../../v2'

export default {
    openapi: '3.1.0',
    info: {
        title: 'Patreon API',
        version: `${APIVersion}`,
        description: 'An unofficial OpenAPI schema for the V2 Patreon API. Made based on the official api with https://github.com/ghostrider-05/patreon-api.ts',
        // They mention in the FAQ on the dev portal that there will be an API TOS soon...
        termsOfService: 'https://patreon.com/legal',
        // Put official contact or library info?
        contact: {
            name: 'Patreon',
            url: 'https://www.patreondevelopers.com/'
        },
    },
    externalDocs: {
        description: 'Official Patreon documentation',
        url: 'https://docs.patreon.com',
    },
    servers: [
        {
            description: 'API domain',
            url: 'https://patreon.com',
        }
    ],
    tags: [
        {
            name: 'resource',
            externalDocs: {
                description: 'Resource endpoints documentation',
                url: 'https://docs.patreon.com/#apiv2-resource-endpoints',
            }
        },
        {
            name: 'webhook',
            externalDocs: {
                description: 'Webhook endpoints documentation',
                url: 'https://docs.patreon.com/#apiv2-webhook-endpoints',
            }
        }
    ]
}
