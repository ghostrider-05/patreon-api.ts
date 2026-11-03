/* eslint-disable @typescript-eslint/no-unused-vars */
// #region token-options
// @errors: 2578
// @ts-expect-error duplicate-imports
declare const env: { [x: string]: string }
// @ts-expect-error duplicate-imports @errors: 2578
// ---cut-before---
import { PatreonCreatorClient } from 'patreon-api.ts'

const client = new PatreonCreatorClient({
    oauth: {
        token: env.CREATOR_ACCESS_TOKEN,
    },
})
// #endregion token-options
// #region token-request-options
// @errors: 2578
// @ts-expect-error duplicate-imports
declare const env: { [x: string]: string }
// @ts-expect-error duplicate-imports
// ---cut-before---
import { PatreonCreatorClient } from 'patreon-api.ts'

const client = new PatreonCreatorClient({
    // ... client options
})

// Use a query for requesting attributes
// See making a request for more information
const response = await client.fetchCampaigns(undefined, {
    token: env.CREATOR_ACCESS_TOKEN,
})
// #endregion token-request-options
// #region token-options-client
// @errors: 2578
// @ts-expect-error duplicate-imports
declare const env: { [x: string]: string }
// @ts-expect-error duplicate-imports
// ---cut-before---
import { PatreonCreatorClient } from 'patreon-api.ts'

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
// #endregion token-options-client
// #region token-store
// @errors: 2578
// @ts-expect-error duplicate-imports
declare const env: { [x: string]: string }
// @ts-expect-error duplicate-imports
// ---cut-before---
import { PatreonCreatorClient, CacheTokenStore, type RestEventMap } from 'patreon-api.ts'
import { EventEmitter } from 'node:stream'

// Configure async/sync store and the binding depending on the storage used
// Without a binding, it stores in memory. Configure the binding for other storage providers (SQL, KV, etc)
const cache = new CacheTokenStore(false)
// Get the current token saved on starting the process
const dbToken = cache.get('token')

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
        cache.put('token', refreshedToken)
        // Update the token on the client
        client.oauth.cachedToken = refreshedToken
    }
})

// #endregion token-store