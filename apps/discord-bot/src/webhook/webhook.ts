import {
    type APIMessage,
    type APIThreadChannel,
    ChannelType,
    type RESTPostAPIChannelMessageJSONBody,
    type RESTPostAPIChannelMessagesThreadsJSONBody,
    type RESTPostAPIGuildForumThreadsJSONBody,
    type RESTPostAPIWebhookWithTokenJSONBody,
    Routes,
} from 'discord-api-types/v10';
import {
    parseWebhookRequest,
    PatreonWebhookTrigger,
    WebhookClient,
} from 'patreon-api.ts';

import { makeDiscordRequest } from '../interactions';
import { getConfig, getPossibleWebhookConfigs, isPostPayload } from './config';
import { createMemberMessage, createPostMessage, createText } from './messages';
import { requiredTriggers, updateGuildRoles } from './roles';
import { getMessageStorage } from './storage';

export const webhookPath = '/patreon/webhook'

export function getPatreonWebhookRoutes (campaigns: Config.CampaignConfig[]): string[] {
    const routes = campaigns.map(c => c.webhooks ? (c.webhooks_path ?? webhookPath) : undefined)
        .filter(route => route != undefined)

    if (routes.length === 0) return []
    else return [...new Set(routes)]
}

function getWebhookUrl (config: Config.WebhookMessageConfig, env: Config.Env) {
    if (config.app_type === 'webhook' || !env.use_bot_scope) {
        const webhookUrl = config.discord_webhook?.url_secret_name
            ? <string | undefined>env[config.discord_webhook.url_secret_name]
            : undefined
        if (!webhookUrl) throw new Error('No webhook found in secrets for Discord webhook: ' + config.discord_webhook?.url_secret_name)
        
        return webhookUrl
    } else return undefined
}

function isThread (type: ChannelType) {
    return [ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread].includes(type)
}

export async function handlePatreonWebhook (request: Request, env: Config.Env): Promise<Response> {
    const path = new URL(request.url).pathname
    const trigger = <Config.WebhookTrigger>request.headers.get(WebhookClient.headers.event)

    const configs = getPossibleWebhookConfigs(path, trigger, env.campaigns, webhookPath)

    if (configs == undefined || configs.options.length === 0) {
        throw new Error('No possible configuration of a patreon webhook found for path: ' + path)
    }

    const parsed = await parseWebhookRequest(request, <string>env[configs.secretName])
    if (!parsed.verified) return new Response('Failed to verify request', { status: 403 })
    console.log(`New Patreon webhook request. Path: ${path}. Event: ${parsed.event}`, configs.options, parsed.payload)

    if (requiredTriggers.includes(parsed.event) && configs.campaign.guild_roles != undefined) {
        await updateGuildRoles({
            config: configs.campaign,
            env,
            member: <never>parsed.payload,
            trigger: parsed.event,
        })
    }

    const config = getConfig(configs.options, parsed.event, parsed.payload)
    if (!config) throw new Error('No configuration found that matches post data')

    const thread_id = isThread(config.channel_type) ? config.channel_id : undefined

    if (isPostPayload(parsed.event, parsed.payload)) {
        const { event, payload } = parsed
        const postOptions: Config.WebhookMessagePostConfig = config?.posts ?? {}
        
        const storage = getMessageStorage(postOptions, env)
        const webhookUrl = getWebhookUrl(config, env)

        const postMessage = createPostMessage(config, payload)

        if (event === PatreonWebhookTrigger.PostDeleted) {
            if (storage && postOptions?.delete_original_message) {
                const message = await storage.fetchItem(payload.data.id)

                if (!message) {
                    console.log('Failed to find original message for post in Discord')
                } else {
                    await makeDiscordRequest({
                        env,
                        method: 'DELETE',
                        reason: postOptions.delete_audit_log_reason,
                        bot: {
                            path: Routes.channelMessage(config.channel_id, message.messageId),
                        },
                        webhook: {
                            url: webhookUrl,
                            path: `/messages/${message.messageId}`,
                            params: {
                                thread_id,
                            },
                        },
                    })
                }
            }

            if (config.send_deleted_event_message) {
                await makeDiscordRequest({
                    env,
                    method: 'POST',
                    bot: {
                        path: Routes.channelMessages(config.channel_id),
                        body: JSON.stringify(postMessage),
                    },
                    webhook: {
                        url: webhookUrl,
                        params: {
                            thread_id,
                        },
                    },
                })
            }

            await storage?.deleteItem(payload.data.id)

            return new Response()
        } else if (event === PatreonWebhookTrigger.PostUpdated) {
            if (storage && postOptions?.edit_original_message) {
                const message = await storage.fetchItem(payload.data.id)

                if (!message) {
                    console.log('Failed to find original message for post in Discord')
                } else {
                    await makeDiscordRequest({
                        env,
                        method: 'PATCH',
                        reason: postOptions.edit_audit_log_reason,
                        bot: {
                            path: Routes.channelMessage(config.channel_id, message.messageId),
                            body: JSON.stringify(postMessage),
                        },
                        webhook: {
                            url: webhookUrl,
                            path: `/messages/${message.messageId}`,
                            params: {
                                thread_id,
                            },
                        },
                    })
                }
            } else if (config.send_edited_event_message) {
                await makeDiscordRequest({
                    env,
                    method: 'POST',
                    bot: {
                        path: Routes.channelMessages(config.channel_id),
                        body: JSON.stringify(postMessage),
                    },
                    webhook: {
                        url: webhookUrl,
                        params: {
                            thread_id,
                        },
                    },
                })
            }

            return new Response()
        } else if (event === PatreonWebhookTrigger.PostPublished) {
            const options = postOptions.published_posts ?? {}

            if (options.forum_create_posts) {
                // TODO: add support for media channels
                if (config.channel_type !== ChannelType.GuildForum) {
                    throw new Error('Can\'t create threads in a non-forum channel')
                }

                const thread_name = createText(options.forum_title ?? config.title, payload.data.attributes, 'title', options.forum_unknown_title ?? 'New post published')
                    .slice(0, 100)

                const response = await makeDiscordRequest({
                    env,
                    method: 'POST',
                    reason: options.thread_reason,
                    bot: {
                        path: Routes.threads(config.channel_id),
                        body: JSON.stringify({
                            message: postMessage,
                            name: thread_name,
                            applied_tags: options.forum_tags ?? [],
                            auto_archive_duration: options.thread_auto_archive,
                            rate_limit_per_user: options.thread_rate_limit,
                        } satisfies RESTPostAPIGuildForumThreadsJSONBody),
                    },
                    webhook: {
                        url: webhookUrl,
                        body: JSON.stringify({
                            ...postMessage,
                            applied_tags: options.forum_tags ?? [],
                            thread_name,
                            username: config.discord_webhook?.username,
                            avatar_url: config.discord_webhook?.avatar_url,
                        } satisfies RESTPostAPIWebhookWithTokenJSONBody),
                        params: {
                            thread_id,
                            wait: true,
                        },
                    },
                })

                // TODO: type error object
                const json = await response.json() as (APIThreadChannel & { message: APIMessage })
                if (!response.ok) throw new Error(JSON.stringify(json, null, 4))

                if (storage) {
                    await storage.save({
                        postId: payload.data.id,
                        messageId: json.id,
                    })
                }

                return new Response()
            } else {
                const response = await makeDiscordRequest({
                    env,
                    method: 'POST',
                    bot: {
                        path: Routes.channelMessages(config.channel_id),
                        body: JSON.stringify(postMessage satisfies RESTPostAPIChannelMessageJSONBody),
                    },
                    webhook: {
                        url: webhookUrl,
                        params: {
                            thread_id,
                            wait: true,
                        },
                    },
                })

                const json = await response.json() as APIMessage
                if (!response.ok) throw new Error(JSON.stringify(json, null, 4))

                if (storage) {
                    await storage.save({
                        messageId: json.id,
                        postId: payload.data.id,
                    })
                }

                if (options.create_thread) {
                    await makeDiscordRequest({
                        env,
                        method: 'POST',
                        reason: options.thread_reason,
                        bot: {
                            path: Routes.threads(config.channel_id, json.id),
                            body: JSON.stringify({
                                name: createText(config.title, payload.data.attributes, 'title', 'New post published')
                                    .slice(0, 100),
                                auto_archive_duration: options.thread_auto_archive,
                                rate_limit_per_user: options.thread_rate_limit,
                            } satisfies RESTPostAPIChannelMessagesThreadsJSONBody),
                        },
                    })
                }

                if (options.announce_message) {
                    if (config.channel_type !== ChannelType.GuildAnnouncement) {
                        throw new Error('Not announcing message for published post since channel is not an announcement channel')
                    }
    
                    if (config.app_type === 'webhook') {
                        throw new Error('Not announcing message because webhooks can\'t announce message')
                    }
    
                    await makeDiscordRequest({
                        env,
                        method: 'POST',
                        bot: {
                            path: Routes.channelMessageCrosspost(config.channel_id, json.id),
                        },
                    })
                }

                return new Response()
            }
        } else {
            console.log('Unknown trigger: ' + parsed.event)

            return new Response()
        }
    } else {
        await updateGuildRoles({
            config: configs.campaign,
            env,
            member: <never>parsed.payload,
            trigger: parsed.event,
        })

        // @ts-expect-error Should be member payload
        const message = createMemberMessage(config, parsed.payload)
        const type = <'create' | 'update' | 'delete'>parsed.event.split(':')[1]

        if (type === 'update' && !config.send_edited_event_message) {
            return new Response()
        }

        if (type === 'delete' && !config.send_deleted_event_message) {
            return new Response()
        }

        await makeDiscordRequest({
            env,
            method: 'POST',
            bot: {
                path: Routes.channelMessages(config.channel_id),
                body: JSON.stringify(message satisfies RESTPostAPIChannelMessageJSONBody),
            },
            webhook: {
                url: getWebhookUrl(config, env),
                body: JSON.stringify({
                    ...message,
                    avatar_url: config.discord_webhook?.avatar_url,
                    username: config.discord_webhook?.username,
                } satisfies RESTPostAPIWebhookWithTokenJSONBody),
                params: {
                    thread_id,
                },
            },
        })

        return new Response()
    }
}