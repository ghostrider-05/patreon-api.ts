import { Type } from '../../../../v2'
import type { Route } from '../../../../utils/openapi'

import { getResourceParameters } from './parameters'

// eslint-disable-next-line jsdoc/require-jsdoc
function createBaseItem(resource: Type) {
    return {
        id: {
            type: 'string',
        },
        type: {
            type: 'string',
            enum: [resource],
        },
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
function createResponse(resource: Type, array?: boolean) {
    const { includesKeys, resources } = getResourceParameters(resource)

    const data = {
        required: ['id', 'type'],
        properties: {
            ...createBaseItem(resource),
            attributes: {
                $ref: `#/components/schemas/${resource}`,
            },
            relationships: {
                properties: includesKeys.reduce((props, key) => ({
                    ...props,
                    [key.includeKey]: {
                        required: ['data'],
                        properties: {
                            data: key.isArray
                                ? { type: 'array', items: { properties: createBaseItem(key.resourceKey), required: ['id', 'type'] } }
                                : { properties: createBaseItem(key.resourceKey), required: ['id', 'type'] },
                            ...(!key.isArray ? { links: { properties: { related: { type: 'string', format: 'uri' } } } } : {}),
                        }
                    }
                }), {}),
            },
        }
    }

    return {
        type: 'object',
        required: ['data', array ? 'links' : 'meta'],
        properties: {
            data: array ? { type: 'array', items: data } : data,
            included: {
                type: 'array',
                items: {
                    oneOf: resources.map(resource => ({
                        required: ['attributes', 'type', 'id'],
                        properties: {
                            ...createBaseItem(resource),
                            attributes: {
                                $ref: `#/components/schemas/${resource}`,
                            },
                        }
                    })),
                }
            },
            ...(array
                ? {
                    meta: {
                        properties: {
                            total: { type: 'number' },
                            pagination: {
                                properties: {
                                    cursors: {
                                        properties: {
                                            next: { type: ['string', 'null'] }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                : { links: { properties: { self: { type: 'string' } } } }
            )
        }
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
export default function (routes: Route[]) {
    return {
        '200': {
            description: 'OK',
        },
        '400': {
            description: 'Something was wrong with your request (syntax, size too large, etc.)',
            content: {
                'application/json': {
                    schema: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/APIError',
                        },
                    }
                }
            }
        },
        '401': {
            description: 'Authentication failed (bad API key, invalid OAuth token, incorrect scopes, etc.)',
        },
        ...routes.reduce((obj, route) => ({
            ...obj,
            [`${route.resource}${route.response?.array ? 's' : ''}Response`]: {
                description: 'OK',
                content: {
                    'application/json': {
                        schema: createResponse(route.resource, route.response?.array),
                    }
                }
            }
        }), {}),
    }
}
