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
                '**/schemas/v2/generated/',
                '**/schemas/v2/scripts/',
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