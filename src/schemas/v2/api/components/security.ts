import { PatreonOauthScope } from '../../../../v2'
import { getJsDocDescription, getTypes } from '../../scripts/shared'

const scopeEnum = getTypes('./src/rest/v2/oauth2/scopes.ts')
    .getEnumOrThrow('PatreonOauthScope')

export default {
    auth: {
        type: 'oauth2',
        flows: {
            authorizationCode: {
                tokenUrl: 'https://patreon.com/api/oauth2/token',
                authorizationUrl: 'https://patreon.com/oauth2/authorize',
                scopes: Object.keys(PatreonOauthScope)
                    .reduce((scopes, scope) => {
                        const description = getJsDocDescription(scopeEnum.getMemberOrThrow(scope))

                        return {
                            ...scopes,
                            [PatreonOauthScope[scope]]: description,
                        }
                    }, {})
            }
        }
    }
}
