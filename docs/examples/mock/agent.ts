// @ts-expect-error duplicate-imports
// #region mock-agent
import { PatreonMock, Routes } from 'patreon-api.ts'

declare const agent: import('undici-types').MockAgent

const mockAPI = new PatreonMock()

// Intercept any API call
agent
    .get(PatreonMock.origin)
    .intercept({ path: PatreonMock.pathFilter })
    .reply(mockAPI.getMockAgentReplyCallback())
    .delay(600)

// Intercept a specific API route
agent
    .get(PatreonMock.origin)
    .intercept({ path: PatreonMock.path + Routes.identity() })
    .reply(mockAPI.getMockAgentReplyCallback())
    .delay(600)
// #endregion mock-agent

// @ts-expect-error duplicate-imports
// #region mock-agent-response
import { PatreonMock, PatreonMockData, Routes, Type } from 'patreon-api.ts'

declare const mockAgent: import('undici-types').MockAgent
const data = new PatreonMockData()

const testUserPayload = data.getSingleResponsePayload(Type.User, {
    includes: [],
    attributes: { user: ['full_name'] },
}, {
    id: data.createId(Type.User),
    item: { full_name: 'My test username' },
    relatedItems: [],
})

mockAgent
    .get(PatreonMock.origin)
    .intercept({ path: PatreonMock.path + Routes.identity() })
    .reply(
        200,
        JSON.stringify(testUserPayload),
        { headers: { 'Content-Type': 'application/json'} },
    )
// #endregion mock-agent-response
