import { PatreonCreatorClient, PatreonStore } from 'patreon-api.ts'

interface StoreOptions {
    key: string
    kv: KVNamespace
}

/**
 *
 * @param env
 * @param store
 */
export function createClient (env: Config.Env, store: StoreOptions) {
    return new PatreonCreatorClient({
        oauth: {
            clientId: env.PATREON_CLIENT_ID,
            clientSecret: env.PATREON_CLIENT_SECRET,
        },
        store: new PatreonStore.KV(store.kv, store.key),
    })
}
