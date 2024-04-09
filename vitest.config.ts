import { defineConfig } from 'vitest/config'

export default defineConfig({
    root: 'src',
    test: {
        reporters: ['basic']
            .concat(process.env.GITHUB_ACTIONS ? ['github-actions'] : []),

        coverage: {
            provider: 'istanbul',
            thresholds: {
                // TODO: change to 100
                // '100': true,
                branches: 60,
                functions: 60,
                lines: 60,
                statements: 60,
            }
        },
    },
})