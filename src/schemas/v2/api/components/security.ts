export default (scopes?: Record<string, string>) => ({
    Oauth2: {
        type: 'oauth2',
        flows: {
            authorizationCode: {
                tokenUrl: 'https://patreon.com/api/oauth2/token',
                authorizationUrl: 'https://patreon.com/oauth2/authorize',
                scopes: scopes ?? {}
            }
        }
    },
})
