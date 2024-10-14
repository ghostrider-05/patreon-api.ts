import { writeFile } from 'fs/promises'

import {
    PatreonOauthScope,
    RequestMethod,
    Type,
} from '../v2'

export interface Route {
    route:
        | ((id: string) => string)
        | (() => string)
    resource: Type
    tags: string[]
    scopes?: PatreonOauthScope[]
    params?: {
        id?: string
    }
    response?: {
        array?: boolean
    }
    methods: {
        method: RequestMethod
        id: string
        body?: Record<string, unknown>
    }[]
}

interface PathSchemaOptions {
    base: string
    routes: Route[]
    contentType: string
    formatId: (id: string | null) => string
    parameters: (
        | string
        | { ref: string, methods?: RequestMethod[], param?: keyof NonNullable<Route['params']> }
    )[]
    responses: (route: Route) => (
        | number
        | string
        | { status: number | string, description?: string, ref?: string }
    )[]
    documentation?: (route: Route, method: RequestMethod) => {
        url: string
        description?: string
    }
}

interface SchemaOptions {
    fileName: string
    spacing: number
    paths: PathSchemaOptions
    components: (routes: Route[]) => Record<string, unknown>
    details: Record<string, unknown>
}

// eslint-disable-next-line jsdoc/require-jsdoc
function createPaths (schema: PathSchemaOptions) {
    return schema.routes.reduce((obj, path) => ({
        ...obj,
        [schema.base + path.route(schema.formatId(path.params?.id ?? null))]: path.methods.reduce((options, data) => {
            const { id, method, body } = data
            const externalDocs = schema.documentation?.(path, method)
            const requestBody = body != undefined
                ? {
                    requestBody: {
                        required: true,
                        content: { [schema.contentType]: { schema: body } }
                    }
                }: {}

            const parameters = schema.parameters
                .map(param => typeof param === 'string' ? { ref: param } : param)
                .filter((ref) => {
                    return (ref.methods == undefined || ref.methods.includes(method))
                        && (ref.param ? path.params?.[ref.param] != undefined : true)
                }).map(ref => ({ $ref: `#/components/parameters/${ref.param ? path.params?.[ref.param] : ref.ref}` }))

            const responses = schema.responses(path)
                .map(res => typeof res === 'object' ? res : { status: res })
                .reduce((data, res) => ({
                    ...data,
                    [res.status]: {
                        $ref: `#/components/responses/${res.ref ?? res.status}`,
                        ...(res.description ? { description: res.description } : {}),
                    },
                }), {})

            return {
                ...options,
                [method.toLowerCase()]: {
                    tags: path.tags,
                    operationId: id,
                    ...(externalDocs ? { externalDocs } : {}),
                    ...requestBody,
                    parameters,
                    responses,
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
    await writeFile(options.fileName, JSON.stringify({
        ...options.details,
        components: options.components(options.paths.routes),
        paths: createPaths(options.paths)
    }, null, options.spacing))
}
