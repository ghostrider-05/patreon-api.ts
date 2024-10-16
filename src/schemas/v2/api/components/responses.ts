import { PATREON_RESPONSE_HEADERS, Type } from '../../../../v2'
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

const errorTable = {
    '400': {
        summary: 'Bad Request',
        description: 'Something was wrong with your request (syntax, size too large, etc.)',
    },
    '401': {
        summary: 'Unauthorized',
        description: 'Authentication failed (bad API key, invalid OAuth token, incorrect scopes, etc.)',
    },
    '403': {
        summary: 'Forbidden',
        description: 'The requested is hidden for administrators only.',
    },
    '404': {
        summary: 'Not Found',
        description: 'The specified resource could not be found.',
    },
    '405': {
        summary: 'Method Not Allowed',
        description: 'You tried to access a resource with an invalid method.',
    },
    '406': {
        summary: 'Not Acceptable',
        description: 'You requested a format that isn\'t json.',
    },
    '410': {
        summary: 'Gone',
        description: 'The resource requested has been removed from our servers.',
    },
    '429': {
        summary: 'Too Many Requests',
        description: 'Slow down!',
    },
    '500': {
        summary: 'Internal Server Error',
        description: 'Our server ran into a problem while processing this request. Please try again later.',
    },
    '503': {
        summary: 'Service Unavailable',
        description: 'We\'re temporarily offline for maintenance. Please try again later.',
    },
}

export const errorCodes = Object.keys(errorTable) as (keyof typeof errorTable)[]

// eslint-disable-next-line jsdoc/require-jsdoc
export default function (routes: Route[]) {
    const successTable = {
        '200': {
            summary: 'OK',
            description: 'Completed your request succesfully',
        },
    }

    const headers = Object.values(PATREON_RESPONSE_HEADERS).reduce((headers, name) => ({
        ...headers,
        [name]: { $ref: `#/components/headers/${name}`}
    }), {})

    return {
        ...Object.entries(errorTable).reduce((response, table) => ({
            ...response,
            [table[0]]: {
                description: `${table[1].summary}: ${table[1].description}`,
                content: {
                    'application/json': {
                        schema: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/APIError',
                            },
                        }
                    }
                },
                headers,
            }
        }), {}),
        ...routes.reduce((obj, route) => ({
            ...obj,
            [`${route.resource}${route.response?.array ? 's' : ''}Response`]: {
                description: `${successTable[200].summary}: ${successTable[200].description}`,
                content: {
                    'application/json': {
                        schema: createResponse(route.resource, route.response?.array),
                    }
                },
                headers,
            }
        }), {}),
    }
}
