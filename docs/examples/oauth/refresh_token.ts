/* eslint-disable @typescript-eslint/no-non-null-assertion */
// #region cache-token
import { PatreonCreatorClient } from 'patreon-api.ts'

declare const env: {
    CLIENT_ID: string
    CLIENT_SECRET: string
    CREATOR_ACCESS_TOKEN: string
    CREATOR_REFRESH_TOKEN: string
}

const client = new PatreonCreatorClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
        token: {
            access_token: env.CREATOR_ACCESS_TOKEN,
            refresh_token: env.CREATOR_REFRESH_TOKEN,
        },
    },
})

// The cached token is the token from the client options
const clientToken = client.oauth.cachedToken!

const refreshedToken = await client.oauth.refreshToken(clientToken)
// #endregion cache-token