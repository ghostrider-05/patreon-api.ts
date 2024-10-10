import { PATREON_RESPONSE_HEADERS } from '../../../../v2'

export default {
    [PATREON_RESPONSE_HEADERS.UUID]: {
        schema: {
            type: 'string',
        },
    },
    [PATREON_RESPONSE_HEADERS.Sha]: {
        schema: {
            type: 'string',
        },
    },
    [PATREON_RESPONSE_HEADERS.CfCacheStatus]: {
        schema: {
            type: 'string',
        },
    },
    [PATREON_RESPONSE_HEADERS.CfRay]: {
        schema: {
            type: 'string',
        },
    },
}