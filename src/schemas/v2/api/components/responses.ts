export default {
    '200': {
        description: 'OK',
    },
    '400': {
        description: 'Something was wrong with your request (syntax, size too large, etc.)',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: {
                        $ref: '#/components/schemas/APIError',
                    },
                }
            }
        }
    },
    '401': {
        description: 'Authentication failed (bad API key, invalid OAuth token, incorrect scopes, etc.)',
    },
}
