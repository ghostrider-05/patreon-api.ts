import type { OpenAPIV3_1 } from 'openapi-types'

import { Oauth2Routes } from '../../../../rest/v2/oauth2/routes'

export default (scopes?: Record<string, string>) => ({
    Oauth2: {
        type: 'oauth2',
        flows: {
            authorizationCode: {
                tokenUrl: Oauth2Routes.accessTokenUri,
                authorizationUrl: Oauth2Routes.authorizationUri,
                scopes: scopes ?? {}
            }
        }
    }  satisfies OpenAPIV3_1.SecuritySchemeObject,
})
