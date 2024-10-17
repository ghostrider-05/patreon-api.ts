import { RequestMethod, SchemaRelationshipKeys, Type } from '../../../../v2'

import { RestClient } from '../../../../rest/v2/oauth2/rest'

// eslint-disable-next-line jsdoc/require-jsdoc
export function getResourceParameters (resource: Type) {
    const relationshipKeys = SchemaRelationshipKeys as Record<Type, {
        resourceKey: Type
        includeKey: string
        isArray: boolean
        isRelated: boolean
    }[]>

    const includes = relationshipKeys[resource].map(({ includeKey }) => includeKey)

    const resources = includes.map(includeKey => {
        // Throw when includes field is not found
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return relationshipKeys[resource].find(key => key.includeKey === includeKey)!.resourceKey
    })

    return {
        includes,
        resources,
        includesKeys: relationshipKeys[resource],
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function createQueryParameters (resource: Type, method: RequestMethod, listing: boolean) {
    if (method !== RequestMethod.Get) return []
    const parameters = getResourceParameters(resource)

    return [
        {
            name: 'include',
            in: 'query',
            required: false,
            style: 'form',
            explode: false,
            schema: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: parameters.includes,
                }
            },
        },
        {
            name: 'fields',
            in: 'query',
            required: false,
            style: 'deepObject',
            explode: true,
            schema: {
                type: 'object',
                properties: parameters.resources.concat(resource).reduce((props, id) => ({
                    ...props,
                    [id]: {
                        type: 'array',
                        items: {
                            type: 'string',
                            $ref: `#/components/schemas/${id}`,
                        },
                    }
                }), {})
            }
        },
        ...(listing ? [
            {
                name: 'sort',
                in: 'query',
                required: false,
                style: 'form',
                explode: false,
                schema: {
                    type: 'string',
                },
            },
            {
                name: 'page',
                in: 'query',
                required: false,
                style: 'deepObject',
                explode: true,
                schema: {
                    type: 'object',
                    properties: {
                        cursor: {
                            type: 'string',
                        },
                        count: {
                            type: 'number',
                        },
                    }
                }
            }
        ] : [])
    ]
}

export default {
    id: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
            type: 'string',
        },
    },
    campaign_id: {
        name: 'campaign_id',
        in: 'path',
        required: true,
        schema: {
            type: 'string',
        },
    },
    userAgent: {
        name: 'User-Agent',
        in: 'header',
        required: true,
        schema: {
            type: 'string',
            default: new RestClient().userAgent,
        }
    },
}
