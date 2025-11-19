import { describe, expect, it } from 'vitest'

import {
    getLastFetchMockCall,
    mockFetch,
    mockFetchReturnValue,
    restClient as client,
} from '../../client'

import {
    PatreonMockData,
    RestClient,
} from '../../../v2'

const JsonResponse = (...args: Parameters<typeof Response.json>) => {
    return Promise.resolve(Response.json(...args))
}

const ratelimitedResponse = (
    retryAfter: number,
    options?: { headers?: boolean, body?: boolean },
) => JsonResponse({
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

describe('client methods', () => {
    it('default values before any requests', () => {
        expect(client.limited).toBeFalsy()
        expect(client.requestCounter.count).toBe(0)
        expect(client.invalidRequestCounter.count).toBe(0)
    })

    it('default user agent', () => {
        expect(RestClient['defaultUserAgent']).toBeDefined()
        expect(client.userAgent).toBeDefined()
    })

    it('user agent', () => {
        expect(client.userAgent).toBeDefined()
    })

    it ('with no fetch defined', () => {
        const globalFetch = global.fetch
        // @ts-expect-error Making fetch undefined
        global.fetch = undefined

        expect(() => {
            new RestClient({
                fetch: undefined,
            })
        }).toThrowError('No global fetch function found. Specify options.fetch with your fetch function')

        global.fetch = globalFetch
    })

    it('clear ratelimit', () => {
        // set a limit of 10s
        client['ratelimiter'].applyTimeout(10, 0)
        expect(client.limited).toBe(true)

        client.clearRatelimitTimeout()
        client.requestCounter.clear()
        expect(client.limited).toBe(false)
    })
})

describe('requests', () => {
    it('GET request: 200 status', async () => {
        mockFetchReturnValue(JsonResponse({ data: [] }, {
            status: 200,
            headers: PatreonMockData.createHeaders(),
        }))

        const response = await client.get<{ data: [] }>('/api', {
            accessToken: 'token',
        })

        const [url, init] = getLastFetchMockCall()
        expect(url).toEqual('https://patreon.com/api')
        // @ts-expect-error ??????????
        expect(init?.headers['Authorization']).toEqual('Bearer token')
        expect(response).toEqual({ data: [] })
    })

    it('GET request: 200 status, no auth', async () => {
        mockFetchReturnValue(JsonResponse({ data: [] }, {
            status: 200,
            headers: PatreonMockData.createHeaders(),
        }))

        const response = await client.get<{ data: [] }>('/api', {
            auth: false,
            api: 'https://api.patreon.com',
            fetch: mockFetch,
            query: '?with_query=true',
            headers: {
                'X-Custom-Header': 'test',
            },
        })

        const [url, init] = getLastFetchMockCall()
        expect(url).toEqual('https://api.patreon.com/api?with_query=true')
        // @ts-expect-error ??????????
        expect(init?.headers['Authorization']).toBeUndefined()
        // @ts-expect-error ??????????
        expect(init?.headers['X-Custom-Header']).toBe('test')

        expect(response).toEqual({ data: [] })
    })

    it('PATCH request: 200 status', async () => {
        mockFetchReturnValue(JsonResponse({ data: [] }, {
            status: 200,
            headers: PatreonMockData.createHeaders(),
        }))

        const response = await client.patch<{ data: [] }>('/api', {
            accessToken: 'token',
            body: JSON.stringify({}),
        })

        expect(response).toEqual({ data: [] })
    })

    it('GET request: missing access token', async () => {
        mockFetchReturnValue(JsonResponse({ data: [] }, {
            status: 200,
            headers: PatreonMockData.createHeaders(),
        }))

        await expect(client.get<{ data: [] }>('/api'))
            .rejects.toThrowError('Missing access token for authenticated request')
    })

    it('GET request: retried request', async () => {
        mockFetchReturnValue(JsonResponse({ errors: [] }, {
            status: 500,
            headers: PatreonMockData.createHeaders(),
        }))
        mockFetchReturnValue(JsonResponse({ data: [] }, {
            status: 200,
            headers: PatreonMockData.createHeaders(),
        }))

        const response = await client.get<{ data: [] }>('/api', {
            accessToken: 'token',
        })

        expect(response).toEqual({ data: [] })
    })

    it('GET request: returns Error', async () => {
        // @ts-expect-error Error is no Response
        mockFetchReturnValue(Promise.resolve(new Error('Something went wrong...')))

        await expect(client.get<{ data: [] }>('/api', { accessToken: 'token' }))
            .rejects.toThrowError('Something went wrong...')
    })

    it('GET request: invalid body', async () => {
        mockFetchReturnValue(Promise.resolve(new Response('Some Cloudflare block message', { status: 400 })))

        await expect(client.get<{ data: [] }>('/api', { accessToken: 'token' }))
            .rejects.toThrowError('Received an invalid error response:\n"Some Cloudflare block message"')
    })

    it('GET request: timed out', { timeout: 500 }, async () => {
        // Resolve after test timeout
        mockFetchReturnValue(new Promise(resolve => setTimeout(() => resolve(Response.json({})), 1_000)), {
            retries: 3,
        })

        await expect(client.get<{ data: [] }>('/api', {
            accessToken: 'token',
            timeout: 10,
        })).rejects.toThrowError('The operation was aborted due to timeout')
    })

    it('GET request: ratelimited, no retry information', async () => {
        const error = ratelimitedResponse(10)
        mockFetchReturnValue(error)

        await expect(client.get<{ data: [] }>('/api', {
            accessToken: 'token',
        })).rejects.toThrowError()
    })

    it('GET request: ratelimited, retry information in body', async () => {
        const error = ratelimitedResponse(10, { body: true })
        mockFetchReturnValue(error)

        await expect(client.get<{ data: [] }>('/api', {
            accessToken: 'token',
        })).rejects.toThrowError()
    })

    it('GET request: ratelimited, retry information in body and headers', async () => {
        const error = ratelimitedResponse(10, { body: true, headers: true })
        mockFetchReturnValue(error)

        await expect(client.get<{ data: [] }>('/api', {
            accessToken: 'token',
        })).rejects.toThrowError()
    })

    it('GET request: ratelimited, with second attempt', async () => {
        const error = ratelimitedResponse(3, { body: true })
        mockFetchReturnValue(error)

        await expect(client.get<{ data: [] }>('/api', {
            accessToken: 'token',
        })).rejects.toThrowError()

        expect(client.limited).toEqual(true)
        // Ensure all counters are not limited
        expect(client.requestCounter.limited).toBe(false)
        expect(client.invalidRequestCounter.limited).toBe(false)
        
        // New request, awaited
        mockFetchReturnValue(JsonResponse({ data: [] }, {
            status: 200,
            headers: PatreonMockData.createHeaders(),
        }))

        const response = await client.get<{ data: [] }>('/api', {
            accessToken: 'token',
        })

        expect(response).toEqual({ data: [] })
    })

    it('DELETE request: 204 response', async () => {
        mockFetchReturnValue(Promise.resolve(new Response(null, {
            status: 204,
            headers: PatreonMockData.createHeaders(),
        })))

        const response = await client.delete<string>('/api/id', {
            accessToken: 'token',
        })

        expect(response).toHaveLength(0)
    })
})
