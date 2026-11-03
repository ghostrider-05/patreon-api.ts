import { defineConfig } from 'tsdown'

export default defineConfig([
    {
        name: 'patreon-api.ts',
        clean: true,
        dts: true,
        outDir: 'dist',
        nodeProtocol: true,
        format: [
            'cjs',
            'esm',
        ],
        entry: [
            'src/index.ts',
        ],
    },
])
