import {
    PatreonCreatorClient,
    PatreonUserClient,
} from '../v2'

export const clientId = 'client_id'
export const clientSecret = 'client_secret'

export const creatorClient = new PatreonCreatorClient({
    oauth: {
        clientId,
        clientSecret,
        token: {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
        },
    },
})

export const userClient = new PatreonUserClient({
    oauth: {
        clientId,
        clientSecret,
        redirectUri: 'https://ghostrider-05.com/',
    }
})
