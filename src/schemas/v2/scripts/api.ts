import { writeFile } from 'fs/promises'

// import { SchemaRelationshipKeys, Type } from '../../../v2'

import details from '../api/details'
import routes from '../api/paths/'
import * as components from '../api/components/'
import type { Route } from '../api/types/paths'
import { RequestMethod } from '../../../v2'

// const relationshipKeys = SchemaRelationshipKeys as Record<Type, {
//     resourceKey: Type
//     includeKey: string
//     isArray: boolean
//     isRelated: boolean
// }[]>

interface SchemaOptions {
    fileName: string
    spacing: number
}

interface PathSchemaOptions {
    base: string
    routes: Route[]
}

// eslint-disable-next-line jsdoc/require-jsdoc
function createPaths (options: PathSchemaOptions) {
    return options.routes.reduce((obj, path) => ({
        ...obj,
        [options.base + path.route(`{${path.params?.id ?? 'id'}}`)]: path.methods.reduce((options, data) => {
            const { id, method, body } = data
            // const includes = relationshipKeys[path.resource].map(key => key.includeKey)
            // const resources = includes.map(includeKey => {
            //     // Throw when includes field is not found
            //     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            //     return relationshipKeys[path.resource].find(key => key.includeKey === includeKey)!.resourceKey
            // }).concat(path.resource)

            return {
                ...options,
                [method.toLowerCase()]: {
                    tags: path.tags,
                    operationId: id,
                    externalDocs: {
                        description: 'Official documentation',
                        url: `https://docs.patreon.com/#${method.toLowerCase()}-api-oauth2-v2${path.route(path.params?.id ?? 'id')
                            .replace(/\//g, '-')}`,
                    },
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
                    parameters: [
                        ...(path.params ? [
                            {
                                '$ref': `#/components/parameters/${path.params.id ?? 'id'}`,
                            }
                        ] : []),
                        ...(method === RequestMethod.Get ? [
                            {
                                '$ref': '#/components/parameters/include',
                            }
                        ]: []),
                        {
                            '$ref': '#/components/parameters/userAgent',
                        },
                    ],
                    responses: {
                        '200': {
                            '$ref': '#/components/responses/200'
                        }
                    },
                    security: [
                        {
                            auth: path.scopes ?? [],
                        }
                    ],
                }
            }
        }, {})
    }), {})
}

// eslint-disable-next-line jsdoc/require-jsdoc
export async function writeOpenAPISchema(options: SchemaOptions) {
    const { fileName, spacing } = options

    await writeFile(fileName, JSON.stringify({
        ...details,
        components,
        paths: createPaths({
            base: '/api/oauth/v2',
            routes,
        })
    }, null, spacing))
}
