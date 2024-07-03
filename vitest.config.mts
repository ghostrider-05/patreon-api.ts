import { defineConfig } from 'vitest/config'

const threshold = 70

export default defineConfig({
    root: 'src',
    test: {
        reporters: ['basic']
            .concat(process.env.GITHUB_ACTIONS ? ['github-actions'] : []),

        coverage: {
            provider: 'istanbul',
            exclude: [
                '**/schemas/v2/generated/',
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