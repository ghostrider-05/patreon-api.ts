/* eslint-disable @typescript-eslint/no-non-null-assertion */
// #region token-options
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
// #endregion token-options
// #region token-store
import { PatreonCreatorClient, CacheTokenStore, type RestEventMap } from 'patreon-api.ts'
import { EventEmitter } from 'node:stream'

declare const env: {
    CLIENT_ID: string
    CLIENT_SECRET: string
    SERVER_TOKEN: string
}

// Configure async/sync store and the binding depending on the storage used
const cache = new CacheTokenStore(true)
// Get the current token saved on starting the process
const dbToken = (await cache.get('token'))!

const emitter = new EventEmitter<RestEventMap>()

const client = new PatreonCreatorClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
        token: dbToken,
    },
    rest: {
        emitter,
    }
})

emitter.on('response', async ({ response }) => {
    // Refresh the creator token when a 401 response is received
    if (response.status === 401) {
        // Get the token from the client options
        const currentToken = client.oauth.cachedToken
        if (!currentToken) return console.log('No token to refresh')
        const refreshedToken = await client.oauth.refreshToken(currentToken)

        // Save it your DB
        await cache.put('token', refreshedToken)
        // Update the token on the client
        client.oauth.cachedToken = refreshedToken
    }
})

// #endregion token-store