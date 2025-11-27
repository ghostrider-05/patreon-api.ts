import {
    APIVersion,
    PatreonWebhookTrigger,
    RouteBases,
    version,
    ResponseHeaders,
    SchemaResourcesData,
    type ItemType,
    PatreonOauthScope,
} from 'patreon-api.ts'

interface LibraryData {
    version: number
    base: string
    headers: {
        userAgent: string
        response: Record<'id' | 'sha', string>
    }
    scopes: PatreonOauthScope[]
    schemas: {
        resource: ItemType
        properties: string[]
        relationships: {
            type: 'item' | 'array'
            name: string
            resource: ItemType
        }[]
    }[]
    webhook: {
        triggers: string[]
    }
}

export default <ExportedHandler>{
    async fetch(request) {
        const { pathname, search } = new URL(request.url)

        const proxyEndpoint = '/proxy'
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
                    userAgent: `PatreonBot patreon-api.ts (https://github.com/ghostrider-05/patreon-api.ts, ${version})`,
                    response: {
                        id: ResponseHeaders.UUID,
                        sha: ResponseHeaders.Sha,
                    }
                },
                scopes: Object.values(PatreonOauthScope),
                schemas: <[]>Object.values(SchemaResourcesData),
                webhook: {
                    triggers: Object.values(PatreonWebhookTrigger),
                }
            }

            return new Response(JSON.stringify(data), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                }
            })
        } else if (pathname.startsWith('/data/library')) {
            return new Response(JSON.stringify({
                version,
                name: 'patreon-api.ts',
                links: {
                    donate: 'https://paypal.me/05ghostrider',
                    github: 'https://github.com/ghostrider-05/patreon-api.ts',
                    documentation: 'https://patreon-api.pages.dev',
                },
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                }
            })
        } else if (pathname.startsWith(proxyEndpoint)) {
            const response = await fetch(RouteBases.oauth2 + pathname.slice(proxyEndpoint.length) + search, {
                method: request.method,
                headers: request.headers,
                body: request.body,
            })

            const responseBody = await response.json()

            const newResponse = new Response(JSON.stringify(responseBody), response)

            for (const [key, value] of Object.entries(corsHeaders)) {
                newResponse.headers.set(key, value)
            }

            return newResponse
        }
    }
}