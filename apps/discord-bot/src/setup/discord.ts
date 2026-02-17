import {
    Routes,
    OAuth2Scopes,
    PermissionFlagsBits,
    ChannelType,
    type RESTPostAPIGuildRoleJSONBody,
} from 'discord-api-types/v10'
import { PatreonWebhookTrigger } from 'patreon-api.ts'
import { makeDiscordRequest } from '../interactions'

import { createLinkedRoleRedirect } from '../linked-roles/oauth'
import register from '../linked-roles/register'

// eslint-disable-next-line jsdoc/require-jsdoc
function getScopes (env: Config.Options) {
    const scopes: OAuth2Scopes[] = []

    if (env.use_bot_scope) scopes.push(OAuth2Scopes.Bot)
    if (env.use_app_commands_scope) scopes.push(OAuth2Scopes.ApplicationsCommands)

    return scopes
}

// eslint-disable-next-line jsdoc/require-jsdoc
function getPermissionsForWebhook (config: Config.WebhookMessageConfig | undefined) {
    if (!config) return []

    const permissions: bigint[] = []
    const threadTypes = [ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread]

    if (threadTypes.includes(config.channel_type)) {
        permissions.push(PermissionFlagsBits.SendMessagesInThreads)
    }


    if ([ChannelType.GuildForum].includes(config.channel_type)) {
        if (config.send_edited_event_message || config.send_deleted_event_message) {
            permissions.push(PermissionFlagsBits.SendMessagesInThreads)
        }
    }

    if (config.posts?.message_storage) {
        if (config.posts.delete_original_message || config.posts.edit_original_message || config.posts.delete_edit_messages) {
            permissions.push(PermissionFlagsBits.ManageMessages)
        }
    }

    if (config.published_posts) {
        if (config.published_posts.announce_message) {
            permissions.push(PermissionFlagsBits.ManageMessages)
        }

        if (config.published_posts.create_thread) {
            if (![ChannelType.GuildForum].includes(config.channel_type)) {
                permissions.push(PermissionFlagsBits.CreatePublicThreads)
            }
        }
    }

    return [...new Set(permissions)]
}

// eslint-disable-next-line jsdoc/require-jsdoc
function getPermissions (env: Config.Options) {
    const permissions: bigint[] = []

    for (const campaign of env.campaigns) {
        if (campaign.guild.roles != undefined) {
            permissions.push(PermissionFlagsBits.ManageRoles)

            if (campaign.guild.roles.roles.some(role => role.managed_by_integration != undefined)) {
                permissions.push(PermissionFlagsBits.ManageRoles)
            }

            if (campaign.guild.roles.roles.some(role => role.id === campaign.guild.id)) {
                throw new Error('Guild role cant be the default role in guild: ' + campaign.guild.id)
            }
        }

        if (campaign.webhook != undefined) {
            permissions.push(PermissionFlagsBits.SendMessages)

            permissions.push(...getPermissionsForWebhook(campaign.webhook))

            for (const trigger of Object.values(PatreonWebhookTrigger)) {
                permissions.push(...getPermissionsForWebhook(campaign.webhook[trigger]))
            }
        }
    }

    return [...new Set(permissions)]
    // eslint-disable-next-line
        .reduce((bit, permission) => bit |= permission, BigInt(0))
        .toString()
}

export interface ConfigureDiscordOptions {
    paths: {
        interactions: string
        linkedRolesCallback: string
    }
    edit_app?: boolean
    register_linked_roles?: boolean
    register_guild_app_roles?: boolean
}

// eslint-disable-next-line jsdoc/require-jsdoc
export async function configureDiscordBot (env: Config.Env, options: ConfigureDiscordOptions) {
    if (!env.use_bot_scope) return
    if (!env.DISCORD_BOT_TOKEN) throw new Error('No Discord bot token configured')

    const app: Record<string, unknown> = {}
    const { app_config } = env
    const app_permissions = getPermissions(env)

    if (env.linked_roles) {
        app['role_connections_verification_url'] = createLinkedRoleRedirect(env, options.paths.linkedRolesCallback)

        if (options.register_linked_roles) await register(env)
    }

    if (env.use_app_commands_scope) {
        app['interactions_endpoint_url'] = `${env.worker_url}${options.paths.interactions}`
    }

    if (app_config.tags) app['tags'] = app_config.tags
    if (app_config.description) app['description'] = app_config.description

    if (app_config.installation_custom_url) {
        app['custom_install_url'] = app_config.installation_custom_url
    } else if (app_config.in_app_installation ?? true) {
        app['install_params'] = {
            scopes: getScopes(env),
            permissions: app_permissions,
        }
    }

    if (options.edit_app) await makeDiscordRequest({
        env,
        method: 'PATCH',
        bot: {
            path: Routes.currentApplication(),
            body: JSON.stringify(app),
        }
    })

    for (const campaign of env.campaigns) {
        for (const role of (campaign.guild.roles?.roles ?? [])) {
            if (role.managed_by_integration != undefined) {
                if (options.register_guild_app_roles) await makeDiscordRequest({
                    env,
                    method: 'POST',
                    bot: {
                        path: Routes.guildRoles(campaign.guild.id),
                        body: JSON.stringify({
                            name: role.managed_by_integration.name,
                            color: role.managed_by_integration.color,
                            hoist: role.managed_by_integration.hoist,
                        } satisfies RESTPostAPIGuildRoleJSONBody),
                    }
                })
            }
        }
    }
}