import type { OpenAPIV3_1 } from 'openapi-types'

import { PatreonWebhookTrigger, Type } from '../../../../v2'
import {
    getJsDocDescription,
    getJsDocTags,
    getTypes,
} from '../../../../../scripts/v2/shared'

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
                    const externalDocs = getJsDocTags(property, 'see')?.at(0)

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
                            description: getJsDocDescription(property),
                            ...(externalDocs ? { externalDocs: { url: externalDocs } } : {}),
                            ...(format != undefined ? { format } : {}),
                            ...(examples != undefined && examples.length
                                ? { examples: baseType === 'number' ? examples.map(Number) : examples }
                                : {}
                            ),
                        } as NonNullable<OpenAPIV3_1.SchemaObject['properties']>[string]
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
    JSONAPIError: {
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
    JSONAPIResource: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
            },
            id: {
                readOnly: true,
                type: 'string',
            }
        },
        required: [
            'id',
            'type',
        ],
        discriminator: {
            propertyName: 'type',
        },
    },
    JSONAPILinksRelated: {},
    JSONAPIResponseLinks: {
        properties: {
            self: {
                type: 'string'
            }
        }
    },
    JSONAPIResponseMeta: {
        properties: {
            meta: {
                properties: {
                    total: {
                        type: 'number',
                    },
                    pagination: {
                        properties: {
                            cursors: {
                                properties: {
                                    next: { type: ['string', 'null'] },
                                }
                            }
                        }
                    }
                }
            }
        }
    },
} satisfies Record<string, OpenAPIV3_1.SchemaObject>
