import { useOpenapi, httpVerbs } from 'vitepress-openapi'

import { fetchOpenAPISchema, openAPIUrlV2 } from '../.vitepress/theme/openapi'

export default {
    async paths() {
        const spec = await fetchOpenAPISchema(openAPIUrlV2)

        const openapi = useOpenapi({ spec })

        if (!openapi?.json?.paths) {
            return []
        }

        return Object.keys(openapi.json.paths)
            .flatMap((path) => {
                return httpVerbs
                    .filter((verb) => openapi.json.paths[path][verb])
                    .map((verb) => {
                        const { operationId, summary } = openapi.json.paths[path][verb]
                        return {
                            params: {
                                operationId,
                                pageTitle: `${summary} - Patreon API`,
                            },
                        }
                    })
            })
    },
}