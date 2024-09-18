import { PatreonCreatorClient, PatreonStore } from "patreon-api.ts";
import { Config } from "../types";

export function createClient (env: Config.Env, kv: KVNamespace, key: string) {
    return new PatreonCreatorClient({
        oauth: {
            clientId: env.PATREON_CLIENT_ID,
            clientSecret: env.PATREON_CLIENT_SECRET,
        },
        store: new PatreonStore.KV(kv, key),
    })
}
