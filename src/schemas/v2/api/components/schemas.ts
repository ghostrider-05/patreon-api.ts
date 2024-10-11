import { PatreonWebhookTrigger, Type } from '../../../../v2'
import { getJsDocDescription, getTypes } from '../../scripts/shared'

interface ResourceSchemaOptions<T extends string> {
    schemas: T[]
    folder: string
    getDetails: (schema: T) => {
        interfaceName: string
        fileName: string
        documentation: Record<'description' | 'url', string>
        formatMap?: Record<string, 'uri' | 'date-time'>
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
function createResourceSchemas <T extends string> (options: ResourceSchemaOptions<T>) {
    return options.schemas.reduce((schemas, schema) => {
        const { documentation, fileName, interfaceName, formatMap } = options.getDetails(schema)

        const declaration = getTypes(`${options.folder}${fileName}.ts`)
            .getInterfaceOrThrow(interfaceName)

        return {
            ...schemas,
            [schema]: {
                type: 'object',
                title: interfaceName,
                description: getJsDocDescription(declaration),
                externalDocs: documentation,
                properties: declaration.getProperties().reduce((properties, property) => {
                    const type = property.getType().getNonNullableType(), nullType = 'null'
                    const nullable = property.getType().isNullable()
                    const baseType = type.getBaseTypeOfLiteralType().getText()
                    const format = formatMap?.[property.getName()]

                    return {
                        ...properties,
                        [property.getName()]: {
                            ...(
                                type.isArray()
                                    ? {
                                        type: (nullable ? ['array', nullType] : 'array'),
                                        items: { type: type.getArrayElementType()?.getText() }
                                    }
                                    : { type: nullable ? [baseType, nullType] : baseType }
                            ),
                            ...(
                                // Ignore booleans, otherwise the enum will be: ['true', 'false']
                                type.isUnion() && !type.isBoolean()
                                    ? { enum: type.getUnionTypes().map(t => t.getText().replace(/"/g, '')) }
                                    : {}
                            ),
                            ...(format != undefined ? { format } : {}),
                            description: getJsDocDescription(property),
                        }
                    }
                }, {})
            },
        }
    }, {})
}

export default {
    ...createResourceSchemas({
        schemas: Object.values(Type),
        folder: './src/schemas/v2/resources/',
        getDetails: (type) => {
            const typeName = type === Type.Client ? 'oauth_client' : type
            const fileName = typeName.replace('-', '_')

            const interfaceName = typeName.split(/-|_/).map(t => t[0]?.toUpperCase() + t.slice(1)).join('')
            const header = typeName.replace('_', '')
                + ([Type.Campaign, Type.Post, Type.User].includes(type) ? '-v2' : '')

            return {
                fileName,
                interfaceName,
                documentation: {
                    description: `Official documentation for the ${interfaceName} resource`,
                    url: `https://docs.patreon.com/#${header}`
                },
                // TODO: temperary solution to use this map
                formatMap: {
                    'created_at': 'date-time',
                    'next_deliverable_due_date': 'date-time',
                    'completed_at': 'date-time',
                    'due_at': 'date-time',
                    'reached_at': 'date-time',
                    'upload_expires_at': 'date-time',
                    'last_charge_date': 'date-time',
                    'next_charge_date': 'date-time',
                    'pledge_relationship_start': 'date-time',
                    'published_at': 'date-time',
                    'edited_at': 'date-time',
                    'date': 'date-time',
                    'unpublished_at': 'date-time',
                    'created': 'date-time',
                    'last_attempted_at': 'date-time',
                    'image_small_url': 'uri',
                    'image_url': 'uri',
                    'main_video_url': 'uri',
                    // Campaign.pledge_url is relative, so not typed as uri
                    'rss_artwork_url': 'uri',
                    'thanks_video_url': 'uri',
                    'download_url': 'uri',
                    'upload_url': 'uri',
                    'icon_url': 'uri',
                    'privacy_policy_url': 'uri',
                    // 'redirect_uris': 'uri',
                    'tos_url': 'uri',
                    'embed_url': 'uri',
                    'url': 'uri',
                    'thumb_url': 'uri',
                    'uri': 'uri',
                }
            }
        }
    }),
    webhookTrigger: {
        type: 'array',
        title: 'Webhook trigger',
        items: {
            type: 'string',
            enum: Object.values(PatreonWebhookTrigger)
                .map(t => t.toString()),
        },
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
    APIError: {
        type: 'object',
        // TODO: add properties
    },
}
