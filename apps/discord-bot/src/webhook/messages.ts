import {
    type RESTPostAPIChannelMessageJSONBody,
} from "discord-api-types/v10";
import {
    type PatreonWebhookPostTrigger,
    type WebhookPayload,
    PatreonWebhookMemberTrigger,
} from "patreon-api.ts";

// TODO
function html2md (html: string | null): string {
    if (html == null || html.length === 0) return ''

    return html
}

export function createText <Keys extends string>(
    option: string | undefined,
    attributes: Record<Keys, unknown>,
    attribute?: Keys,
    unknown?: string
) {
    return option != undefined
        ? Object.keys(attributes).reduce((text, key) => text.replace(`{{${key}}}`, attributes[key]), option)
        : new String((attribute ? attributes[attribute] : undefined) ?? unknown ?? '').toString()
}

export function createPostMessage (
    config: Config.WebhookMessageConfig,
    payload: WebhookPayload<PatreonWebhookPostTrigger>,
) {
    const description = html2md(payload.data.attributes.content)

    const content = config.format_type === 'embed'
        ? { embeds: [{
            color: config.embed_color,
            description,
            title: createText(config.title, payload.data.attributes, 'title'),
            footer: config.embed_footer ? {
                text: config.embed_footer,
            } : undefined,
            url: config.posts?.embed_url_to_post ? payload.data.attributes.url : undefined,
            image: config.posts?.embed_post_media && payload.data.attributes.embed_url ? {
                url: payload.data.attributes.embed_url,
            } : undefined
        }]} satisfies RESTPostAPIChannelMessageJSONBody
        : { content: description || payload.data.attributes.title! }

    return {
        allowed_mentions: {},
        components: config.posts?.buttons != undefined
            && (config.app_type === 'webhook' ? config.discord_webhook?.is_app_owned : true)
                ? [{ type: 1, components: config.posts.buttons }]
                : undefined,
        ...content,
    } satisfies RESTPostAPIChannelMessageJSONBody
}

export function createMemberMessage (
    config: Config.WebhookMessageConfig,
    payload: WebhookPayload<PatreonWebhookMemberTrigger>,
) {
    const content = config.format_type === 'embed'
        ? { embeds: [{
            color: config.embed_color,
            description: createText(config.description, payload.data.attributes),
            title: createText(config.title, payload.data.attributes),
            footer: config.embed_footer ? {
                text: config.embed_footer,
            } : undefined,
        }]} satisfies RESTPostAPIChannelMessageJSONBody
        : { content: createText(config.title, payload.data.attributes) || createText(config.description, payload.data.attributes) }

    return {
        allowed_mentions: {},
        components: config.posts?.buttons != undefined
            && (config.app_type === 'webhook' ? config.discord_webhook?.is_app_owned : true)
                ? [{ type: 1, components: config.posts.buttons }]
                : undefined,
        ...content,
    } satisfies RESTPostAPIChannelMessageJSONBody
}
