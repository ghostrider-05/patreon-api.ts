import {
    type APIInteraction,
    InteractionResponseType,
    InteractionType,
} from 'discord-api-types/v10'

export * from './request'

// eslint-disable-next-line jsdoc/require-jsdoc
function hex2bin(hex: string | null) {
    if (hex == null) return new Uint8Array()

    const buf = new Uint8Array(Math.ceil(hex.length / 2))

    for (let i = 0; i < buf.length; i++) {
        buf[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    return buf
}

/**
 * Handle interaction requests
 * @param request The Discord request
 * @param env Env
 * @returns a response
 */
export default async function (request: Request, env: Config.Env) {
    if (request.method !== 'POST') {
        return new Response(null, { status: 400 })
    }

    const signature = hex2bin(request.headers.get('X-Signature-Ed25519'))
    const timestamp = request.headers.get('X-Signature-Timestamp')
    const unknown = await request.text()

    const key = await crypto.subtle.importKey(
        'raw',
        hex2bin(env.app_config.public_key),
        {
            name: 'NODE-ED25519',
            namedCurve: 'NODE-ED25519',
            // public: true,
        },
        true,
        ['verify'],
    )

    const verified = await crypto.subtle.verify(
        'NODE-ED25519',
        key,
        signature,
        new TextEncoder().encode(timestamp + unknown),
    )

    if (!verified) {
        return new Response('invalid request', { status: 401 })
    }

    const data: APIInteraction = JSON.parse(unknown)

    if (data.type === InteractionType.Ping) {
        return Response.json({ type: InteractionResponseType.Pong })
    }

    // TODO: add interactions
}
