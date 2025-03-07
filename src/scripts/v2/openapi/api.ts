import details from '../../../schemas/v2/api/details'
import routes from '../../../schemas/v2/api/paths'
import * as components from '../../../schemas/v2/api/components'

import { createQueryParameters } from '../../../schemas/v2/api/components/parameters'
import { APIErrorCodes } from '../../../schemas/v2/api/components/errors'

import { PatreonOauthScope } from '../../../rest/v2'

import { writeOpenAPISchema } from './schema'
import { getJsDocDescription, getTypes } from '../shared'

const baseAPIPath = '/api/oauth2/v2'

// eslint-disable-next-line jsdoc/require-jsdoc
function getScopes () {
    const scopeEnum = getTypes('./src/rest/v2/oauth2/scopes.ts')
        .getEnumOrThrow('PatreonOauthScope')

    return Object.keys(PatreonOauthScope)
        .reduce((scopes, scope) => {
            const description = getJsDocDescription(scopeEnum.getMemberOrThrow(scope))

            return {
                ...scopes,
                [PatreonOauthScope[scope]]: description,
            }
        }, {})

}

// eslint-disable-next-line jsdoc/require-jsdoc
function getDocumentationUrl (route: string, method: string) {
    return 'https://docs.patreon.com/#'
        + method.toLowerCase()
        + (baseAPIPath + route).replace(/\//g, '-')
}

export default (fileName: string, preview?: boolean) => writeOpenAPISchema({
    fileName,
    spacing: 2,
    details,
    components(routes) {
        return {
            ...components,
            securitySchemes: components.securitySchemes(getScopes()),
            responses: components.responses(routes),
        }
    },
    paths: {
        base: baseAPIPath,
        routes,
        includeExperimentalRoutes: !!preview,
        formatId: (id) => `{${id ?? 'id'}}`,
        contentType: 'application/json',
        parameters: [
            { ref: '', param: 'id' },
            'userAgent',
        ],
        getRoute(route, method) {
            const statusCode = route.methods.find(m => m.method === method)?.responseStatus
                ?? route.response?.status

            return {
                documentation: {
                    description: 'Official documentation',
                    url: getDocumentationUrl(route.route(route.params?.id ?? 'id'), method),
                },
                responses: [
                    statusCode ? { status: statusCode, description: '' } : {
                        status: 200,
                        ref: `${route.resource}${route.response?.array ? 's' : ''}Response`
                    },
                    ...APIErrorCodes,
                ],
                parameters: createQueryParameters(route.resource, method, route.response?.array ?? false),
            }
        },
    },
})
