# Oauth

The Patreon API is only accessible by authorizing your request with an access token:

- [Creator token](#creator-token): the tokens you can find in the developer portal. Use this if you are only using the API for your own account
- [User Oauth](#user-oauth2): user can login to Patreon and be redirect to your application. Use this to grant access to users to a Patreon only part of your application.

## Creator token

If you don't need to handle Oauth2 requests, but only your own creator profile, the first example will get you started.
It is recommended to [sync your token](#store) to your database or store it somewhere safe, so the token is not lost.

```ts
import { PatreonCreatorClient, PatreonStore } from 'patreon-api.ts'

const creatorClient = new PatreonCreatorClient({
    oauth: {
        clientId: process.env.PATREON_CLIENT_ID!,
        clientSecret: process.env.PATREON_CLIENT_SECRET!,
        // Either set the token in the options
        // or configure a store and call <Client>.initialize()
        token: {
            access_token: process.env.PATREON_CREATOR_ACCESS_TOKEN!,
            refresh_token: process.env.PATREON_CREATOR_REFRESH_TOKEN!,
        },
    },
    store: new PatreonStore.Fetch('<url>'),
})
```

## User oauth2

For handling Oauth2 requests, add `redirectUri` and if specified a `state` to the options.
Determine the `scopes` you will need, request only the scopes that your application requires.
Then fetch the token for the user with request url.
Note that for handling Oauth2 requests the client will not cache or store the tokens anywhere in case you need to refresh it!

```ts
import { PatreonUserClient } from 'patreon-api.ts'

// Minimal configuration for handling Oauth2
const userClient = new PatreonUserClient({
    oauth: {
        clientId: process.env.PATREON_CLIENT_ID!,
        clientSecret: process.env.PATREON_CLIENT_SECRET!,
        redirectUri: '<uri>',
    }
})

export default {
    // The Oauth2 callback request with the code parameter
    fetch: async (request) => {
        // Instance will have the token assiocated with 
        const instance = await userClient.createInstance(request)
        const user = await instance.fetchIdentity(<query>)

        // Store the (access &) refresh token if you need to make a request later
        await storeToken(user, instance.token)

        // Check if the user has access
    }
}
```

## Routes

See [`/examples/README.md`](https://github.com/ghostrider-05/patreon-api.ts/tree/main/examples/README.md).

## Store

There are 3 built-in methods of retreiving and storing tokens:

1. Manual loading and storing
2. Fetch: use an external server that accepts `GET` and `PUT` requests
3. KV: store the (creator) token in a KV-like storage system (present on a lot of edge-runtimes).

```ts
// Use stored tokens in a database
// And directly call the `store.get` method on starting the client
const storeClient = new PatreonCreatorClient({
    oauth: {
        clientId: process.env.PATREON_CLIENT_ID!,
        clientSecret: process.env.PATREON_CLIENT_SECRET!,
    },
    name: '<application>', // The application name in the dashboard
    store: {
        get: async () => {
            // Get your stored token
            return <never>{
                access_token: '<token>',
                //...refresh, expires, etc.
            }
        },
        put: async (token) => {
            console.log(JSON.stringify(token))
        }
    }
})
```

```ts
import { PatreonCreatorClient } from 'patreon-api.ts'

interface Env {
    PATREON_CLIENT_ID: string
    PATREON_CLIENT_SECRET: string
    KV_STORE: cf.KVNamespace
}

// Use stored tokens in a database
// And directly call the `store.get` method on starting the client
const storeClient = new PatreonCreatorClient({
    oauth: {
        clientId: env.PATREON_CLIENT_ID,
        clientSecret: env.PATREON_CLIENT_SECRET,
    },
    name: '<application>',
    store: new PatreonStore.KV(env.KV_STORE),
})
```
