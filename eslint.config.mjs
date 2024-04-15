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
                'windows'
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