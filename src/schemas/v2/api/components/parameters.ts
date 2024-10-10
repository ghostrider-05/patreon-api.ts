export default {
    id: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
            type: 'string',
        },
    },
    campaign_id: {
        name: 'campaign_id',
        in: 'path',
        required: true,
        schema: {
            type: 'string',
        },
    },
    include: {
        name: 'include',
        in: 'query',
        required: false,
        style: 'form',
        explode: false,
        schema: {
            type: 'array',
        },
    },
    userAgent: {
        name: 'User-Agent',
        in: 'header',
        required: true,
        schema: {
            type: 'string',
        }
    },
}
