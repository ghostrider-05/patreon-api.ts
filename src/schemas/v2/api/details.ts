import { APIVersion, PatreonOauthScope } from '../../../v2'

export const securitySchemes = {
    auth: {
        type: 'oauth2',
        flows: {
            authorizationCode: {
                tokenUrl: 'https://patreon.com/api/oauth2/token',
                authorizationUrl: 'https://patreon.com/oauth2/authorize',
                scopes: Object.values(PatreonOauthScope)
                    .reduce((scopes, scope) => ({ ...scopes, [scope]: 'A description' }), {})
            }
        }
    }
}

export default {
    openapi: '3.1.0',
    info: {
        title: 'Patreon API',
        version: `v${APIVersion}`,
        description: 'An unofficial OpenAPI schema for the V2 Patreon API. Made based on the official api with https://github.com/ghostrider-05/patreon-api.ts',
        // They mention in the FAQ on the dev portal that there will be an API TOS soon...
        termsOfService: 'https://patreon.com/legal'
    },
    externalDocs: {
        url: 'https://docs.patreon.com',
    },
    servers: [
        {
            url: 'https://patreon.com'
        }
    ],
    tags: [
        {
            name: 'Resources',
            externalDocs: {
                url: 'https://docs.patreon.com/#apiv2-resource-endpoints',
            }
        },
        {
            name: 'Webhooks',
            externalDocs: {
                url: 'https://docs.patreon.com/#apiv2-webhook-endpoints',
            }
        }
    ]
}
