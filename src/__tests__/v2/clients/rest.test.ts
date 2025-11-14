import { describe, expect, it, vi } from 'vitest'

import { PatreonMockData, RestClient } from '../../../v2'

// Cannot use expect().rejects.toThrow(message),
// see https://github.com/vitest-dev/vitest/issues/4559
// TODO: figure out how to validate PatreonError[] error being thrown

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fetch = vi.fn(async (url: string, init?: RequestInit) => new Response(null, { status: 500 }))

const getLastCall = () => {
    const options = fetch.mock.lastCall

    if (!options) throw new Error()
    return options
}

const JsonResponse = (...args: Parameters<typeof Response.json>) => {
    return Promise.resolve(Response.json(...args))
}

const ratelimitedResponse = (retryAfter: number, options?: { headers?: boolean, body?: boolean }) => JsonResponse({
    errors: [PatreonMockData.createError(429, {
        code_name: 'RequestThrottled',
        title: 'You have made too many attempts. Please try again later.',
        ...(options?.body ? { retry_after_seconds: retryAfter } : {}),
    })],
}, {
    status: 429,
    headers: PatreonMockData.createHeaders({
        ratelimit: options?.headers ? { retryAfter: retryAfter.toString() } : undefined,
    }),
})

const client = new RestClient({
    api: 'https://patreon.com',
    fetch,
})

describe('requests', () => {
    it('default values before any requests', () => {
        expect(client.limited).toBeFalsy()
        expect(client.requestCounter.count).toBe(0)
        expect(client.invalidRequestCounter.count).toBe(0)
    })

    it('default user agent', () => {
        expect(RestClient['defaultUserAgent']).toBeDefined()
        expect(client.userAgent).toBeDefined()
    })

    it('GET request: 200 status', async () => {
        fetch.mockReturnValueOnce(JsonResponse({ data: [] }, {
            status: 200,
            headers: PatreonMockData.createHeaders(),
        }))

        const response = await client.get<{ data: [] }>('/api', {
            accessToken: 'token',
        })

        const [url, init] = getLastCall()
        expect(url).toEqual('https://patreon.com/api')
        // @ts-expect-error ??????????
        expect(init?.headers['Authorization']).toEqual('Bearer token')
        expect(response).toEqual({ data: [] })
    })

    it('GET request: missing access token', async () => {
        fetch.mockReturnValueOnce(JsonResponse({ data: [] }, {
            status: 200,
            headers: PatreonMockData.createHeaders(),
        }))

        await expect(client.get<{ data: [] }>('/api'))
            .rejects.toThrowError('Missing access token for authenticated request')
    })

    it('GET request: ratelimited, no retry information', async () => {
        const error = ratelimitedResponse(10)
        fetch.mockReturnValue(error)

        await expect(client.get<{ data: [] }>('/api', {
            accessToken: 'token',
        })).rejects.toThrowError()
    })

    it('GET request: ratelimited, retry information in body', async () => {
        const error = ratelimitedResponse(10, { body: true })
        fetch.mockReturnValue(error)

        await expect(client.get<{ data: [] }>('/api', {
            accessToken: 'token',
        })).rejects.toThrowError()
    })

    it('GET request: ratelimited, retry information in body and headers', async () => {
        const error = ratelimitedResponse(10, { body: true, headers: true })
        fetch.mockReturnValue(error)

        await expect(client.get<{ data: [] }>('/api', {
            accessToken: 'token',
        })).rejects.toThrowError()
    })

    it('DELETE request: 204 response', async () => {
        fetch.mockReturnValue(Promise.resolve(new Response(null, {
            status: 204,
            headers: PatreonMockData.createHeaders(),
        })))

        const response = await client.delete('/api/id', {
            accessToken: 'token',
        })

        expect(response).toBeNull()
    })
})
