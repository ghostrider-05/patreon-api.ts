import {
    Oauth2Routes,
    APIVersion,
    PatreonWebhookTrigger,
    RouteBases,
    VERSION,
    PATREON_RESPONSE_HEADERS,
    SchemaKeys,
    SchemaRelationshipKeys,
    Type,
} from '../../../../'

interface Route {
    route: string
    relationship_type: string
    list?: true
    requires_id?: true
}

export default <ExportedHandler> {
    async fetch () {
        const id = ':id'

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
            routes: [
                {
                    route: Oauth2Routes.campaign(id),
                    relationship_type: 'campaign',
                    requires_id: true,
                },
                {
                    route: Oauth2Routes.campaignMembers(id),
                    relationship_type: Type.Member,
                    list: true,
                },
                {
                    route: Oauth2Routes.campaignPosts(id),
                    relationship_type: Type.Post,
                    list: true,
                    requires_id: true,
                },
                {
                    route: Oauth2Routes.campaigns(),
                    relationship_type: Type.Campaign,
                    list: true,
                },
                {
                    route: Oauth2Routes.identity(),
                    relationship_type: Type.User,
                },
                {
                    route: Oauth2Routes.member(id),
                    relationship_type: Type.Member,
                    requires_id: true,
                },
                {
                    route: Oauth2Routes.post(id),
                    relationship_type: Type.Post,
                },
                {
                    route: Oauth2Routes.webhook(id),
                    relationship_type: Type.Webhook,
                    requires_id: true,
                },
                {
                    route: Oauth2Routes.webhooks(),
                    relationship_type: Type.Webhook,
                    list: true,
                },
            ] satisfies Route[],
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