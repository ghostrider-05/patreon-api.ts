import { readFile, writeFile } from 'node:fs/promises'

import { defineConfig } from 'tsup'

async function updateDistFile (
    path: string,
    mod: string,
    template: (mod: string) => string
) {
    const dist = await readFile(path, { encoding: 'utf8' })
        .then(d => {
            return d
                .replaceAll(template(`'${mod}'`), template(`'node:${mod}'`))
                .replaceAll(template(`"${mod}"`), template(`"node:${mod}"`))
        })

    await writeFile(path, dist, { encoding: 'utf8' })
}

export default defineConfig({
    clean: true,
    dts: true,
    sourcemap: true,
    outDir: 'dist',
    format: [
        'cjs',
        'esm',
    ],
    entry: [
        'src/index.ts'
    ],
    async onSuccess() {
        const libModules = ['crypto']

        for (const mod of libModules) {
            await updateDistFile('./dist/index.js', mod, (mod) => `require(${mod})`)
            await updateDistFile('./dist/index.mjs', mod, (mod) => `from ${mod}`)
        }
    },
})