import { Routes } from "discord-api-types/v10";
import { Config } from "../types";
import { makeDiscordRequest } from "../webhook/discord";

import { defaultLinkedRolesData } from "./default";

export default async function (env: Config.Env) {
    if (!env.linked_roles) return
    if (!(env.linked_roles.register_roles ?? true)) {
        console.log('Not registering linked roles')
    }

    if (!env.use_bot_scope) {
        throw new Error('Requires a bot scope to register linked roles')
    }

    await makeDiscordRequest({
        env,
        method: 'PUT',
        path: Routes.applicationRoleConnectionMetadata(env.app_id),
        body: JSON.stringify((env.linked_roles.data ?? defaultLinkedRolesData).map(d => d.metadata)),
    })
}
