import configs from './eslint.config.mjs'

export default [
    ...configs,
    {
        ignores: [
            'src/__tests__/**',
            'src/schemas/v2/api/**',
            'src/scripts/**',
        ],
        rules: {
            'no-restricted-globals': [
                'warn',
                { globals: Object.getOwnPropertyNames(globalThis) }
            ],
        }
    },
]