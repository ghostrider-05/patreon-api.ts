import { defineConfig } from 'vitest/config'

const threshold = 60

export default defineConfig({
    root: 'src',
    test: {
        reporters: ['basic']
            .concat(process.env.GITHUB_ACTIONS ? ['github-actions'] : []),

        coverage: {
            provider: 'istanbul',
            exclude: [
                '__tests__',
                // Ignore generated scripts and code that generates it
                '**/schemas/v2/api/',
                '**/schemas/v2/generated/',
                '**/scripts/v2/',
                '**/utils/openapi.ts',
                // TODO: add tests
                '**/payloads/v2/normalized/'
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