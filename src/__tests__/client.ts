import { vi } from 'vitest'

import {
    PatreonCreatorClient,
    PatreonUserClient,
    RestClient,
} from '../v2'

export const clientId = 'client_id'
export const clientSecret = 'client_secret'

export const creatorClient = new PatreonCreatorClient({
    oauth: {
        clientId,
        clientSecret,
        token: {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
        },
    },
})

export const userClient = new PatreonUserClient({
    oauth: {
        clientId,
        clientSecret,
        redirectUri: 'https://ghostrider-05.com/',
    }
})

// rest client

// Cannot use expect().rejects.toThrow(message),
// see https://github.com/vitest-dev/vitest/issues/4559
// TODO: figure out how to validate PatreonError[] error being thrown

// The base implementation of globalThis.fetch to catch missing implementations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mockFetch = vi.fn(async (url: string, _init?: RequestInit) => {
    throw new Error('Fetch is not mocked for: ' + url)

    // @ts-expect-error Unreachable code to satisfy return type
    return new Response(null, { status: 500 })
})

// eslint-disable-next-line jsdoc/require-jsdoc
export function mockFetchReturnValue (
    response: Promise<Response>,
    options?: { retries?: number },
): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of Array.from({ length: options?.retries ? (options.retries + 1) : 1 })) {
        mockFetch.mockImplementationOnce((_url, init) => {
            if (!init?.signal) return response

            return Promise.race([
                new Promise<Response>((_resolve, reject) => {
                    init.signal?.addEventListener('abort', (event) => {
                        console.log('Fetch aborted', event.target)

                        const signal = event.target as AbortSignal | null
                        reject(signal?.reason)
                    })
                }),
                response,
            ])
        })
    }
}

export const getLastFetchMockCall = () => {
    const options = mockFetch.mock.lastCall

    if (!options) throw new Error()
    return options
}

export const restClient = new RestClient({
    api: 'https://patreon.com',
    fetch: mockFetch,
    globalRequestsLimit: 600,
    invalidRequestsLimit: {
        amount: 2000,
        interval: 600,
    },
})
