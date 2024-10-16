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
    description?: string
    summary?: string
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
        deprecated?: boolean
        description?: string
        scopes?: PatreonOauthScope[]
        summary?: string
    }[]
}

interface PathSchemaOptions {
    base: string
    routes: Route[]
    contentType: string
    formatId: (id: string | null) => string
    parameters: (
        | string
        | { ref: string | object, methods?: RequestMethod[], param?: keyof NonNullable<Route['params']> }
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
                }).map(ref => ref.param || typeof ref.ref === 'string' ? ({ $ref: `#/components/parameters/${ref.param ? path.params?.[ref.param] : ref.ref}` }) : ref.ref)

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
                summary: path.summary ?? '',
                description: path.description ?? '',
                [method.toLowerCase()]: {
                    tags: path.tags,
                    operationId: id,
                    description: data.description ?? '',
                    summary: data.summary
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        ?? (id.at(0)!.toUpperCase() + id.slice(1).split(/(?=[A-Z])/).map(w => w.toLowerCase()).join(' ')),
                    deprecated: data.deprecated ?? false,
                    ...(externalDocs ? { externalDocs } : {}),
                    ...requestBody,
                    parameters,
                    responses,
                    security: [
                        {
                            auth: data.scopes ?? path.scopes ?? [],
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
