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

interface LibraryData {
    version: number
    base: string
    headers: {
        userAgent: string
        response: Record<'id' | 'sha', string>
    }

    relationships: Record<string, {
        resourceKey: string;
        includeKey: string;
        isArray: boolean;
        isRelated: boolean;
    }[]>
    schemas: Record<string, string[] | readonly string[]>
    webhook: {
        triggers: string[]
    }
}

export default <ExportedHandler>{
    async fetch(request) {
        const { pathname } = new URL(request.url)

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,POST,PATCH,OPTIONS',
            'Access-Control-Max-Age': '86400',
        }

        if (pathname.startsWith('/data')) {
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
                    ...corsHeaders,
                }
            })
        } else if (pathname.startsWith('/proxy')) {
            if (request.method !== 'POST') {
                return new Response(null, {
                    status: 400,
                    headers: corsHeaders,
                })
            }
            const body: { method: string, url: string, headers: Record<string, string> } = await request.json()

            const response = await fetch(body.url, {
                method: body.method,
                headers: body.headers,
            })

            const newResponse = new Response(response.body, response)

            for (const [key, value] of Object.entries(corsHeaders)) {
                newResponse.headers.set(key, value)
            }

            return newResponse
        }
    }
}