import { defineConfig } from 'tsdown'

export default defineConfig([
    {
        name: 'patreon-api.ts',
        report: true,
        clean: true,
        sourcemap: false,
        dts: {
            enabled: true,
            typecheck: true,
            sourcemap: false,
        },
        outDir: 'dist',
        nodeProtocol: true,
        platform: 'node',
        publint: true,
        attw: true,
        checks: {
            bundlerTimings: false,
        },
        deps: {
            onlyBundle: [],
        },
        format: [
            'cjs',
            'esm',
        ],
        entry: [
            'src/index.ts',
        ],
    },
])
