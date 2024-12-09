import { ResponseHeaders, WebhookClient } from '../../../../v2'

export default {
    [ResponseHeaders.UUID]: {
        schema: {
            type: 'string',
        },
    },
    [ResponseHeaders.Sha]: {
        schema: {
            type: 'string',
        },
    },
    [ResponseHeaders.CfCacheStatus]: {
        schema: {
            type: 'string',
        },
    },
    [ResponseHeaders.CfRay]: {
        schema: {
            type: 'string',
        },
    },
    [ResponseHeaders.RetryAfter]: {
        schema: {
            type: 'string',
        },
    },
    [WebhookClient.headers.event]: {
        schema: {
            type: 'string',
        },
    },
    [WebhookClient.headers.signature]: {
        schema: {
            type: 'string',
        },
    },
}
