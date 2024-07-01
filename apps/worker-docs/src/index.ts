import {
    APIVersion,
    PatreonWebhookTrigger,
    RouteBases,
    VERSION,
    PATREON_RESPONSE_HEADERS,
    SchemaKeys,
    SchemaRelationshipKeys,
    Type,
} from 'patreon-api.ts'

import routes from './routes'

import type { LibraryData } from '../../../docs/.vitepress/components/data'

export default <ExportedHandler>{
    async fetch() {
        const data: LibraryData = {
            version: APIVersion,
            base: RouteBases.oauth2,
            headers: {
                userAgent: `PatreonBot patreon-api.ts (https://github.com/ghostrider-05/patreon-api.ts, ${VERSION})`,
                response: {
                    id: PATREON_RESPONSE_HEADERS.UUID,
                    sha: PATREON_RESPONSE_HEADERS.Sha,
                }
            },
            routes,
            schemas: {
                ...Object.keys(SchemaKeys).reduce((obj, key) => ({ ...obj, [key.toLowerCase()]: SchemaKeys[key] }), {}),
                [Type.PledgeEvent]: SchemaKeys.PledgeEvent,
                [Type.Client]: SchemaKeys.OauthClient,
            },
            relationships: SchemaRelationshipKeys,
            webhook: {
                triggers: Object.values(PatreonWebhookTrigger)
            }
        }

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
                'Access-Control-Max-Age': '86400',
            }
        })
    }
}