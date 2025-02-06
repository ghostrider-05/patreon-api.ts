import 'patreon-api.ts'
import type { BasePatreonQuery, GetResponsePayload } from 'patreon-api.ts'

declare module 'patreon-api.ts' {
    interface ResponseTransformMap<Query extends BasePatreonQuery> {
        custom: (res: GetResponsePayload<Query>) => {
            response: GetResponsePayload<Query>
            campaign_id: string
        }
    }

    interface CustomTypeOptions {
        social_connections: Record<string, { url: string, user_id: string } | null>
    }
}