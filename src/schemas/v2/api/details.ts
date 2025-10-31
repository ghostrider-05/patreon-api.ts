import type { OpenAPIV3_1 } from 'openapi-types'

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
    } satisfies OpenAPIV3_1.InfoObject,
    externalDocs: {
        description: 'Official Patreon documentation',
        url: 'https://docs.patreon.com',
    } satisfies OpenAPIV3_1.ExternalDocumentationObject,
    servers: [
        {
            description: 'API domain',
            url: 'https://patreon.com',
        }
    ] satisfies OpenAPIV3_1.ServerObject[],
    tags: [
        {
            name: 'Resources',
            externalDocs: {
                description: 'Resource endpoints documentation',
                url: 'https://docs.patreon.com/#apiv2-resource-endpoints',
            }
        },
        {
            name: 'Webhooks',
            externalDocs: {
                description: 'Webhook endpoints documentation',
                url: 'https://docs.patreon.com/#apiv2-webhook-endpoints',
            }
        }
    ] satisfies (OpenAPIV3_1.TagObject & {
        'x-displayName'?: string
        'x-scalar-ignore'?: boolean
    })[]
}
