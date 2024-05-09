import { defineConfig } from 'vitest/config'

export default defineConfig({
    root: 'src',
    test: {
        reporters: ['basic']
            .concat(process.env.GITHUB_ACTIONS ? ['github-actions'] : []),

        coverage: {
            provider: 'istanbul',
            exclude: [
                // TODO: add tests for clients
                '**/rest/v2/clients/*.ts',
                '**/rest/v2/oauth2/client.ts',
                '**/rest/v2/oauth2/rest.ts',
                '**/rest/v2/webhooks/client.ts',
            ],
            thresholds: {
                '100': true,
            }
        },
    },
})