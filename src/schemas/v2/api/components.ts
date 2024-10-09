import { PatreonOauthScope, PatreonWebhookTrigger, SchemaKeys, Type } from '../../../v2'
import { getTypes } from '../scripts/shared'

const scopeEnum = getTypes('./src/rest/v2/oauth2/scopes.ts')
    .getEnumOrThrow('PatreonOauthScope')

export const securitySchemes = {
    auth: {
        type: 'oauth2',
        flows: {
            authorizationCode: {
                tokenUrl: 'https://patreon.com/api/oauth2/token',
                authorizationUrl: 'https://patreon.com/oauth2/authorize',
                scopes: Object.keys(PatreonOauthScope)
                    .reduce((scopes, scope) => ({
                        ...scopes,
                        [PatreonOauthScope[scope]]: scopeEnum.getMember(scope)?.getJsDocs()?.[0]?.getDescription().replace('\r\n', '') ?? '',
                    }), {})
            }
        }
    }
}

export const parameters = {
    userAgent: {
        name: 'User-Agent',
        in: 'header',
        required: true,
        schema: {
            type: 'string',
        }
    },
}

const schemaKeys = {
    ...Object.keys(SchemaKeys).reduce((obj, key) => ({ ...obj, [key.toLowerCase()]: SchemaKeys[key] }), {}),
    [Type.PledgeEvent]: SchemaKeys.PledgeEvent,
    [Type.Client]: SchemaKeys.OauthClient,
} as unknown as Record<Type, string[]>

export const schemas = {
    ...Object.values(Type).reduce((schemas, type) => ({
        ...schemas,
        [`${type}Key`]: { type: 'string', enum: schemaKeys[type] }
    }), {}),
    webhookTrigger: {
        type: 'array',
        enum: Object.values(PatreonWebhookTrigger)
            .map(t => t.toString()),
        externalDocs: {
            url: 'https://docs.patreon.com/#triggers-v2',
        },
        examples: [
            [
                PatreonWebhookTrigger.MemberPledgeCreated,
                PatreonWebhookTrigger.MemberUpdated,
                PatreonWebhookTrigger.MemberPledgeDeleted,
            ],
        ]
    },
}

export const responses = {
    '200': {
        description: 'OK',
    },
}
