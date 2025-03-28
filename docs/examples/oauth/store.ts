// #region fetch-store
import { PatreonCreatorClient, PatreonStore } from 'patreon-api.ts'

declare const env: {
    CLIENT_ID: string
    CLIENT_SECRET: string
    SERVER_TOKEN: string
}

const fetchStoreClient = new PatreonCreatorClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
    },
    store: new PatreonStore.Fetch('https://my-website.com/token', (url, init) => {
        return fetch(url, {
            ...init,
            headers: {
                'Authorization': env.SERVER_TOKEN,
            },
        })
    })
})
// #endregion fetch-store
// #region kv-store
import {
    PatreonCreatorClient,
    PatreonStore,
    type PatreonStoreKVStorage,
} from 'patreon-api.ts'

declare const env: {
    CLIENT_ID: string
    CLIENT_SECRET: string
    // Replace this type with your platform's storage type
    kv: PatreonStoreKVStorage
}

const kvStoreClient = new PatreonCreatorClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
    },
    store: new PatreonStore.KV(env.kv, 'patreon_creator_token'),
})
// #endregion kv-store
// #region custom-store
import { PatreonCreatorClient } from 'patreon-api.ts'

declare const env: {
    CLIENT_ID: string
    CLIENT_SECRET: string
}

// Replace with your own store
const customAsyncStorage = new Map()

const customStoreClient = new PatreonCreatorClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
    },
    store: {
        async get() {
            return customAsyncStorage.get('creator_token')
        },
        async put(value) {
            customAsyncStorage.set('creator_token', value)
        },
        async delete() {
            customAsyncStorage.delete('creator_token')
        },
        async list() {
            return [...customAsyncStorage.values()]
        },
    }
})
// #endregion custom-store
// #region store-initialize
import { PatreonCreatorClient } from 'patreon-api.ts'

declare const client: PatreonCreatorClient

const initialized = await client.initialize()
if (initialized) {
    console.log(client.o)
}
// or:
const token = await client.fetchApplicationToken()
if (token.success) {

}
// #endregion store-initialize