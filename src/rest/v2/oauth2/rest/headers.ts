import { VERSION } from '../../../../utils'

export const ResponseHeaders = {
    Sha: 'x-patreon-sha',
    UUID: 'x-patreon-uuid',
    CfCacheStatus: 'cf-cache-status',
    CfRay: 'cf-ray',
    RetryAfter: 'retry-after',
} as const

export type PatreonHeadersData = Record<Lowercase<keyof typeof ResponseHeaders>, string | null>

export type RestHeaders =
    | import('undici-types').Headers
    | import('http').IncomingHttpHeaders
    | Record<string, string>

// eslint-disable-next-line jsdoc/require-jsdoc
export function resolveHeaders (headers: RestHeaders): Record<string, string> {
    const keys = typeof headers.keys === 'function'
        ? [...headers.keys()]
        // TODO: convert to lowercase for consistency
        : Object.keys(headers)

    return keys.reduce<Record<string, string>>((data, key) => ({
        ...data,
        [key]: (typeof headers.get === 'function'
            ? headers.get(key)
            : headers[key])?.toLowerCase(),
    }), {} as Record<string, string>)
}

/**
 * Get Patreon headers from a response
 * @param headers the response headers from Patreon
 * @returns the extracted headers
 */
export function getHeaders (headers: RestHeaders): PatreonHeadersData {
    const resolved = resolveHeaders(headers)

    return {
        sha: resolved[ResponseHeaders.Sha] ?? null,
        uuid: resolved[ResponseHeaders.UUID] ?? null,
        cfcachestatus: resolved[ResponseHeaders.CfCacheStatus] ?? null,
        cfray: resolved[ResponseHeaders.CfRay] ?? null,
        retryafter: resolved[ResponseHeaders.RetryAfter] ?? null,
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function makeUserAgentHeader (clientName: string, appendix?: string): string {
    const userAgentAppendix = VERSION + (appendix?.length ? `, ${appendix}` : '')

    return `${clientName} patreon-api.ts (https://github.com/ghostrider-05/patreon-api.ts, ${userAgentAppendix})`
}
