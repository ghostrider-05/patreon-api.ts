import { PatreonMock } from 'patreon-api.ts'

const mock = new PatreonMock({
    validation: {
        query: true,
        headers: [
            'User-Agent',
            'Content-Type',
            'Authorization',
        ],
    },
})

try {
    mock.getMockAgentReplyCallback()
} catch (err) {
    console.log('Invalid request: ' + err)
}
