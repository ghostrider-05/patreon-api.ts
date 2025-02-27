import { http } from 'msw'
import { PatreonMock } from 'patreon-api.ts'

const mockAPI = new PatreonMock({})

const mockHandlers = mockAPI.getMockHandlers()

export const handlers = [
    http.get(mockHandlers.campaign.url, (info) => {
        const response = mockHandlers.campaign.handler({
            method: 'get',
            url: info.request.url,
        })

        return new Response(response.body, {
            status: response.status,
            headers: response.headers,
        })
    })
]

export const allHandlers = Object.values(mockHandlers).map(handler => {
    return http.get(handler.url, (info) => {
        const response = handler.handler({
            method: 'GET',
            url: info.request.url,
        })

        return new Response(response.body, {
            status: response.status,
            headers: response.headers,
        })
    })
})
