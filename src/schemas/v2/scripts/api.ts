import { RequestMethod } from '../../../v2'

import details from '../api/details'
import routes from '../api/paths/'
import * as components from '../api/components/'

import { writeOpenAPISchema } from '../../../utils/openapi'

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
            { ref: 'include', methods: [RequestMethod.Get] },
            'userAgent',
        ],
        responses(route) {
            return [
                { status: 200, ref: `${route.resource}${route.response?.array ? 's' : ''}Response` },
                400,
            ]
        },
        documentation(path, method) {
            return {
                description: 'Official documentation',
                url: `https://docs.patreon.com/#${method.toLowerCase()}-api-oauth2-v2${path.route(path.params?.id ?? 'id')
                    .replace(/\//g, '-')}`,
            }
        },
    },
})
