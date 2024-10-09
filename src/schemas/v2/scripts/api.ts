import { writeFile } from 'fs/promises'

import { RequestMethod, SchemaRelationshipKeys, Type } from '../../../v2'

import details from '../api/details'
import paths from '../api/paths'
import * as components from '../api/components'

const relationshipKeys = SchemaRelationshipKeys as Record<Type, {
    resourceKey: `${Type}`
    includeKey: string
    isArray: boolean
    isRelated: boolean
}[]>

// eslint-disable-next-line jsdoc/require-jsdoc
export async function writeSchema() {
    await writeFile('./openapi.json', JSON.stringify({
        ...details,
        components,
        paths: paths.reduce((obj, path) => ({
            ...obj,
            ['/api/oauth/v2' + path.route(`{${path.id_name ?? 'id'}}`)]: (path.methods ?? [RequestMethod.Get])
                .reduce((options, method) => {
                    const { body, method: methodName } = typeof method === 'string' ? { method, body: undefined } : method

                    const includes = relationshipKeys[path.relationship_type].map(key => key.includeKey)

                    return {
                        ...options,
                        [methodName.toLowerCase()]: {
                            tags: [path.tag],
                            ...(body != undefined
                                ? {
                                    requestBody: {
                                        required: true,
                                        content: {
                                            'application/json': {
                                                schema: body,
                                            }
                                        }
                                    }
                                }: {}),
                            externalDocs: {
                                description: 'Official documentation',
                                url: `https://docs.patreon.com/#${methodName.toLowerCase()}-api-oauth2-v2${path.route(path.id_name ?? 'id')
                                    .replace(/\//g, '-')}`,
                            },
                            parameters: [
                                path.requires_id ? {
                                    name: path.id_name ?? 'id',
                                    in: 'path',
                                    required: true,
                                    schema: {
                                        type: 'string',
                                    },
                                } : undefined,
                                {
                                    '$ref': '#/components/parameters/userAgent'
                                },
                                {
                                    name: 'include',
                                    in: 'query',
                                    required: false,
                                    style: 'form',
                                    explode: false,
                                    schema: {
                                        type: 'array',
                                        enum: includes,
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
                                        properties: includes
                                            .map(includeKey => {
                                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                                return relationshipKeys[path.relationship_type]
                                                    .find(key => key.includeKey === includeKey)!.resourceKey
                                            })
                                            .concat(path.relationship_type)
                                            .reduce((props, key) => ({ ...props, [key]: { '$ref': `#/components/schemas/${key}Key` } }), {})
                                    }
                                }
                            ].filter(n => n),
                            responses: {
                                '200': {
                                    '$ref': '#/components/responses/200'
                                }
                            }
                        }
                    }
                }, {}),
        }), {})
    }, null, 2))
}
