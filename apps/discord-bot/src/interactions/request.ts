import { RouteBases } from 'discord-api-types/v10'

/**
 *
 * @param params
 */
function createParams (params?: Record<string, string | boolean | number | null | undefined>) {
    return Object.keys(params ?? {}).reduce((str, key) => {
        if (params?.[key] != null && params[key] != undefined) {
            str += `${str.length === 0 ? '?' : '&'}${key}=${params[key]}`
        }
        return str
    }, '')
}

interface RequestOptions<Params> {
    path: string
    body?: string
    params?: Params
}

/**
 *
 * @param data
 * @param data.env
 * @param data.method
 * @param data.reason
 * @param data.bearerToken
 * @param data.bot
 * @param data.webhook
 */
export async function makeDiscordRequest (data: {
    env: Config.Env
    method: string
    reason?: string
    bearerToken?: string
    bot: RequestOptions<{
        thread_id?: string
    }>
    webhook?: Partial<RequestOptions<{
        thread_id?: string
        wait?: boolean
    }>> & {
        url: string | undefined
    }
}) {
    const { env, method, webhook, bot, reason, bearerToken } = data

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if (reason) headers['X-Audit-Log-Reason'] = reason
    if (webhook?.url == undefined) headers['Authorization'] = bearerToken ? `Bearer ${bearerToken}` : `Bot ${env.DISCORD_BOT_TOKEN}`

    const url = webhook?.url
        ? (webhook.url + (webhook.path ?? '') + createParams(webhook.params))
        : (RouteBases.api + bot.path + createParams(bot.params))

    return await fetch(url, {
        method,
        headers,
        body: (webhook ? (webhook.body ?? bot.body) : bot.body) ?? null,
    })
}
