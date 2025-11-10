/* eslint-disable jsdoc/require-jsdoc */
// #region instance
import {
    type Oauth2StoredToken,
    PatreonOauthScope,
    PatreonUserClient,
    QueryBuilder,
} from 'patreon-api.ts'

// Required env variables
declare const env: {
    CLIENT_ID: string
    CLIENT_SECRET: string
}

declare function storeToken(userId: string, token: Oauth2StoredToken): Promise<void>

// Minimal configuration for handling Oauth2
const userClient = new PatreonUserClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
        redirectUri: '<uri>',
        scopes: [
            PatreonOauthScope.Identity,
            PatreonOauthScope.Campaigns,
        ]
    }
})

// The Oauth2 callback request with the code parameter
export const fetch = async (request: Request) => {
    const query = QueryBuilder.identity.setAttributes({
        user: ['is_creator', 'image_url', 'full_name'],
    })

    // Instance will have the token associated with
    const instance = await userClient.createInstance(request)
    // No token is needed since `instance.token` is used
    const user = await instance.fetchIdentity(query)

    // Check if the user has access
    if (!user.data.attributes.is_creator) {
        return new Response('This website only allows creators', { status: 403 })
    }

    // Store the (access &) refresh token if you need to make a request later
    await storeToken(user.data.id, instance.token)

    return new Response(null, { status: 201 })
}
// #endregion instance
// #region code
import {
    type Oauth2StoredToken,
    PatreonOauthScope,
    PatreonUserClient,
    QueryBuilder,
} from 'patreon-api.ts'

// Required env variables
declare const env: {
    CLIENT_ID: string
    CLIENT_SECRET: string
}

declare function storeToken(userId: string, token: Oauth2StoredToken): Promise<void>

// Minimal configuration for handling Oauth2
const userClient = new PatreonUserClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
        redirectUri: '<uri>',
        scopes: [
            PatreonOauthScope.Identity,
            PatreonOauthScope.Campaigns,
        ]
    }
})

export const fetch = async (request: Request) => {
    const token = await userClient.fetchToken(request.url)
    // or:
    // const token = await userClient.fetchToken(request)
    // or with a code from the search params:
    // const token = await userClient.oauth.getOauthTokenFromCode({ code })
    if (!token) return new Response('Failed to fetch token', { status: 500 })

    const query = QueryBuilder.identity.setAttributes({
        user: ['is_creator', 'image_url', 'full_name'],
    })

    // Token is required to pass to each API call
    const user = await userClient.fetchIdentity(query, {
        token,
    })

    // Check if the user has access
    if (!user.data.attributes.is_creator) {
        return new Response('This website only allows creators', { status: 403 })
    }

    // Store the (access &) refresh token if you need to make a request later
    await storeToken(user.data.id, token)

    return new Response(null, { status: 201 })
}
// #endregion code
// #region login-client
import { PatreonOauthScope, PatreonUserClient } from 'patreon-api.ts'

// Required env variables
declare const env: {
    CLIENT_ID: string
    CLIENT_SECRET: string
}

// Minimal configuration for handling Oauth2
const client = new PatreonUserClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
        redirectUri: '<uri>',
        scopes: [
            PatreonOauthScope.Identity,
            PatreonOauthScope.Campaigns,
        ]
    }
})

export function createLoginRedirect () {
    return Response.redirect(client.oauth.oauthUri, 301)
}
// #endregion login-client
// #region login-custom
import { PatreonOauthScope, PatreonUserClient } from 'patreon-api.ts'

// Required env variables
declare const env: {
    CLIENT_ID: string
    CLIENT_SECRET: string
}

// Minimal configuration for handling Oauth2
const client = new PatreonUserClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
    }
})

export function createLoginRedirect () {
    return Response.redirect(client.oauth.createOauthUri({
        redirectUri: '<uri>',
        scopes: [
            PatreonOauthScope.Identity,
            PatreonOauthScope.Campaigns,
        ],
    }), 301)
}
// #endregion login-custom