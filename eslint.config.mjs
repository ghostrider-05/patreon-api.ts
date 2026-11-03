// @ts-check
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

import jsdoc from 'eslint-plugin-jsdoc'

export default defineConfig([
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
            'dist/*',
            'dist/**',
            '**/*.test.ts',
            // Ignore current file
            'eslint.config.mjs',
            'eslint-global.config.mjs',
            // Ignore build config
            'tsdown.config.ts',
            // Ignore test config
            'vitest.config.mts',
        ],
        plugins: {
            jsdoc,
        },
        rules: {
            'jsdoc/check-tag-names': [
                'warn',
                {
                    definedTags: [
                        'format',
                    ]
                }
            ],
            'no-trailing-spaces': [
                'error'
            ],
            'indent': [
                'error',
                4
            ],
            'linebreak-style': [
                'warn',
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
])
