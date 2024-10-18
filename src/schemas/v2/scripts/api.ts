import details from '../api/details'
import routes from '../api/paths/'
import * as components from '../api/components/'

import { writeOpenAPISchema } from '../../../utils/openapi'
import { createQueryParameters } from '../api/components/parameters'
import { errorCodes } from '../api/components/responses'

export default () => writeOpenAPISchema({
    fileName: './src/schemas/v2/generated/openapi.json',
    spacing: 2,
    details,
    components(routes) {
        return {
            ...components,
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
                    url: `https://docs.patreon.com/#${method.toLowerCase()}-api-oauth2-v2${route.route(route.params?.id ?? 'id')
                        .replace(/\//g, '-')}`,
                },
                responses: [
                    { status: 200, ref: `${route.resource}${route.response?.array ? 's' : ''}Response` },
                    ...errorCodes,
                ],
                parameters: createQueryParameters(route.resource, method, route.response?.array ?? false),
            }
        },
    },
})
