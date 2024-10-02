import { Routes } from 'discord-api-types/v10'
import { makeDiscordRequest } from '../interactions/'

import { defaultLinkedRolesData } from './default'

/**
 * Register linked roles
 * @param env Env
 */
export default async function (env: Config.Env) {
    if (!env.linked_roles) return

    if (!env.use_bot_scope) {
        throw new Error('Requires a bot scope to register linked roles')
    }

    await makeDiscordRequest({
        env,
        method: 'PUT',
        bot: {
            path: Routes.applicationRoleConnectionMetadata(env.app_config.id),
            body: JSON.stringify((env.linked_roles.data ?? defaultLinkedRolesData).map(d => d.metadata)),
        },
    })
}
