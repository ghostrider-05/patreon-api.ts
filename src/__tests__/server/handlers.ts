import { http, RequestHandler } from 'msw'

import {
    PatreonMock,
} from '../../v2'

import cacheOptions, { data } from './cache'

const mock = new PatreonMock({
    cache: cacheOptions,
    data,
})

const mockHandlers = mock.getMockHandlers({
    cache: true,
    pathParam: ':id',
    transformResponse(response) {
        return new Response(response.body, {
            headers: response.headers,
            status: response.status,
        })
    },
})

export const apiHandlers = Object.values(mockHandlers).map(handler => {
    return http[handler.method](
        handler.url,
        async ({ request }) => handler.handler(request),
        { once: false }
    )
}) satisfies RequestHandler[]
