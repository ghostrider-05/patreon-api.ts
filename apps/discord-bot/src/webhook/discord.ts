import { RouteBases } from "discord-api-types/v10"

import { Config } from "../types"

function createParams (params?: Record<string, string | boolean | number | null | undefined>) {
    return Object.keys(params ?? {}).reduce((str, key) => {
        if (params?.[key] != null && params[key] != undefined) str += `${str.length === 0 ? '?' : '&'}${key}=${params[key]}`
        return str
    }, '')
}

export async function makeDiscordRequest (data: {
    env: Config.Env
    method: string
    path: string
    webhook?: {
        url: string | undefined
        path?: string
        body?: string
        params?: {
            thread_id?: string
            wait?: boolean
        }
    }
    params?: {
        thread_id?: string
    }
    reason?: string
    body?: string
}) {
    const { env, method, path, webhook, body, reason, params } = data

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if (reason) headers['X-Audit-Log-Reason'] = reason
    if (webhook?.url == undefined) headers['Authorization'] = `Bot ${env.DISCORD_BOT_TOKEN}`

    const url = webhook?.url
        ? (webhook.url + (webhook.path ?? '') + createParams(webhook.params))
        : (RouteBases.api + path + createParams(params))

    return await fetch(url, {
        method,
        headers,
        body: (webhook ? (webhook.body ?? body) : body) ?? null,
    })
}

export function getWebhookUrl (config: Config.WebhookMessageConfig, env: Config.Env) {
    if (config.app_type === 'webhook' || !env.use_bot_scope) {
        const webhookUrl = config.discord_webhook?.url_secret_name
            ? <string | undefined>env[config.discord_webhook.url_secret_name]
            : undefined
        if (!webhookUrl) throw new Error('No webhook found in secrets for Discord webhook: ' + config.discord_webhook?.url_secret_name)
        
        return webhookUrl
    } else return undefined
}
