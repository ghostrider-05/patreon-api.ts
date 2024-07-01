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

export default <ExportedHandler> {
    async fetch () {
        const data = {
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

        return new Response(JSON.stringify(data))
    }
}