import { defineConfig } from 'tsup'

export default defineConfig({
    name: 'patreon-api.ts',
    clean: true,
    dts: true,
    sourcemap: true,
    outDir: 'dist',
    removeNodeProtocol: false,
    format: [
        'cjs',
        'esm',
    ],
    entry: [
        'src/index.ts',
    ],
})
