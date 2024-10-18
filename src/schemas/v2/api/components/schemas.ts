import { PatreonWebhookTrigger, Type } from '../../../../v2'
import { getJsDocDescription, getJsDocTags, getTypes } from '../../scripts/shared'

interface ResourceSchemaOptions<T extends string> {
    schemas: T[]
    folder: string
    getDetails: (schema: T) => {
        interfaceName: string
        fileName: string
        documentation: Record<'description' | 'url', string>
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
function createResourceSchemas <T extends string> (options: ResourceSchemaOptions<T>) {
    return options.schemas.reduce((schemas, schema) => {
        const { documentation, fileName, interfaceName } = options.getDetails(schema)

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
                    const format = getJsDocTags(property, 'format')?.at(0)
                    const examples = getJsDocTags(property, 'example')

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
                            ...(examples != undefined && examples.length
                                ? { examples: baseType === 'number' ? examples.map(Number) : examples }
                                : {}
                            ),
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
    // TODO: add more details
    APIError: {
        type: 'object',
        properties: {
            code: {
                type: 'number',
            },
            code_name: {
                type: 'string',
            },
            detail: {
                type: 'string',
            },
            id: {
                type: 'string',
            },
            status: {
                type: 'string',
            },
            title: {
                type: 'string',
            },
        }
    },
}
