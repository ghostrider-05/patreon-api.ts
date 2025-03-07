// #region handler
import { http } from 'msw'
import { PatreonMock } from 'patreon-api.ts'

const mockAPI = new PatreonMock()

const mockHandlers = mockAPI.getMockHandlers({
    transformResponse(response) {
        return new Response(response.body, {
            headers: response.headers,
            status: response.status,
        })
    },
})

export const handlers = [
    http.get(mockHandlers.getCampaign.url, ({ request }) => {
        return mockHandlers.getCampaign.handler({
            headers: request.headers,
            url: request.url,
        })
    }),
    http.post(mockHandlers.createWebhook.url, async ({ request }) => {
        return mockHandlers.createWebhook.handler({
            headers: request.headers,
            url: request.url,
            body: await request.text(),
        })
    }),
]
// #endregion handler
// #region all-handlers
import { http } from 'msw'
import { PatreonMock } from 'patreon-api.ts'

const mockAPI = new PatreonMock()

const mockHandlers = mockAPI.getMockHandlers({
    transformResponse(response) {
        return new Response(response.body, {
            headers: response.headers,
            status: response.status,
        })
    },
})

export const allHandlers = Object.values(mockHandlers).map(handler => {
    return http[handler.method](handler.url, async ({ request }) => {
        return handler.handler({
            headers: request.headers,
            url: request.url,
            body: handler.method !== 'get'
                ? await request.text()
                : null,
        })
    })
})
// #endregion all-handlers
// #region error-handler
import { http } from 'msw'
import { PatreonMock } from 'patreon-api.ts'

const mockAPI = new PatreonMock()
const mockHandlers = mockAPI.getMockHandlers()

export const errorHandlers = [
    http.get(mockHandlers.getCampaign.url, () => {
        return new Response(JSON.stringify({ errors: [
            mockAPI.data.createError(400),
        ]}), {
            status: 400,
            headers: {},
        })
    })
]
// #endregion error-handler
