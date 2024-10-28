export const APIErrors = {
    '400': {
        summary: 'Bad Request',
        description: 'Something was wrong with your request (syntax, size too large, etc.)',
    },
    '401': {
        summary: 'Unauthorized',
        description: 'Authentication failed (bad API key, invalid OAuth token, incorrect scopes, etc.)',
    },
    '403': {
        summary: 'Forbidden',
        description: 'The requested is hidden for administrators only.',
    },
    '404': {
        summary: 'Not Found',
        description: 'The specified resource could not be found.',
    },
    '405': {
        summary: 'Method Not Allowed',
        description: 'You tried to access a resource with an invalid method.',
    },
    '406': {
        summary: 'Not Acceptable',
        description: 'You requested a format that isn\'t json.',
    },
    '410': {
        summary: 'Gone',
        description: 'The resource requested has been removed from our servers.',
    },
    '429': {
        summary: 'Too Many Requests',
        description: 'Slow down!',
    },
    '500': {
        summary: 'Internal Server Error',
        description: 'Our server ran into a problem while processing this request. Please try again later.',
    },
    '503': {
        summary: 'Service Unavailable',
        description: 'We\'re temporarily offline for maintenance. Please try again later.',
    },
}

export const APIErrorCodes = Object.keys(APIErrors) as (keyof typeof APIErrors)[]
