import { defineConfig } from 'vitest/config'

const threshold = 50

export default defineConfig({
    root: 'src',
    test: {
        watch: false,
        clearMocks: true,
        mockReset: true,

        reporters: ['default']
            .concat(process.env.GITHUB_ACTIONS ? ['github-actions'] : []),

        setupFiles: [
            '__tests__/server.ts',
        ],

        typecheck: {
            enabled: true,
        },

        coverage: {
            reporter: ['text', 'json', 'json-summary'],
            provider: 'istanbul',
            exclude: [
                // Ignore tests
                '__tests__',
                // Ignore generated scripts and code that generates it
                '**/schemas/v2/api/',
                '**/schemas/v2/generated/',
                '**/scripts/v2/',
            ],
            thresholds: {
                branches: threshold,
                functions: threshold,
                lines: threshold,
                statements: threshold,
            }
        },
    },
})
