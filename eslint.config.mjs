// @ts-check
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

import jsdoc from 'eslint-plugin-jsdoc'

export default [
    eslint.configs.recommended,
    ...tseslint.configs.strict,
    jsdoc.configs['flat/recommended-typescript'],
    {
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: globalThis.__dirname,
            },
            ecmaVersion: 'latest',
            sourceType: 'module'
        },
        ignores: [
            '**/*.test.ts',
            // Ignore current file
            'eslint.config.mjs',
            // Ignore tsup config
            'tsup.config.ts',
            // Ignore vitest config
            'vitest.config.mts',
        ],
        plugins: {
            jsdoc,
        },
        rules: {
            // "jsdoc/require-description": "error",
            'no-trailing-spaces': [
                'error'
            ],
            'indent': [
                'error',
                4
            ],
            'linebreak-style': [
                'error',
                // eslint-disable-next-line no-undef
                process.platform === 'win32' ? 'windows' : 'unix',
            ],
            'quotes': [
                'error',
                'single'
            ],
            'semi': [
                'error',
                'never'
            ]
        }
    }
]