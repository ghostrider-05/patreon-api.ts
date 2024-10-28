import details from '../../../schemas/v2/api/details'
import routes from '../../../schemas/v2/api/paths'
import * as components from '../../../schemas/v2/api/components'

import { createQueryParameters } from '../../../schemas/v2/api/components/parameters'
import { APIErrorCodes } from '../../../schemas/v2/api/components/errors'

import { PatreonOauthScope } from '../../../rest/v2'

import { writeOpenAPISchema } from './schema'
import { getJsDocDescription, getTypes } from '../shared'

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

// @ts-expect-error unused preview for now
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        base: '/api/oauth/v2',
        routes,
        formatId: (id) => `{${id ?? 'id'}}`,
        contentType: 'application/json',
        parameters: [
            { ref: '', param: 'id' },
            'userAgent',
        ],
        getRoute(route, method) {
            return {
                documentation: {
                    description: 'Official documentation',
                    url: `https://docs.patreon.com/#${method.toLowerCase()}-api-oauth2-v2${
                        route.route(route.params?.id ?? 'id').replace(/\//g, '-')
                    }`,
                },
                responses: [
                    {
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
