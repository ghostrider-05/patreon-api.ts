import { afterAll, afterEach, beforeAll } from 'vitest'

import { http, RequestHandler } from 'msw'
import { setupServer } from 'msw/node'

import {
    PatreonMock,
} from '../v2'

const mock = new PatreonMock()

const mockHandlers = mock.getMockHandlers({
    // TODO: enable cache
    cache: false,
    pathParam: ':id',
    transformResponse(response) {
        return new Response(response.body, {
            headers: response.headers,
            status: response.status,
        })
    },
})

const apiHandlers = Object.values(mockHandlers).map(handler => {
    return http[handler.method](handler.url, async ({ request }) => {
        return handler.handler({
            headers: request.headers,
            url: request.url,
            body: handler.method !== 'get'
                ? await request.text()
                : null,
        })
    }, { once: false })
}) satisfies RequestHandler[]

const server = setupServer(...[
    ...apiHandlers,
])

beforeAll(() => server.listen({
    onUnhandledRequest: 'error',
}))

afterAll(() => server.close())
afterEach(() => server.resetHandlers())
