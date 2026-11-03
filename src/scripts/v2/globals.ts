import { exec } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cwd } from 'node:process'

const linter = exec('npx eslint -c ./eslint-global.config.mjs "src/**/*.ts"', {
    cwd: cwd(),
})

linter.stdout?.on('data', data => {
    const filter = /(?<=Unexpected use of ')(.+)(?=')/g
    const input: string = data.toString()
    const globals = [...new Set(input.matchAll(filter).map(match => '- '+ match[0]))]
    const content = `# Global variables\n\n${globals.sort().join('\n')}\n`
    console.log(content)

    writeFileSync(resolve('.', './docs/globals.md'), content, { encoding: 'utf8' })
})

linter.on('close', () => process.exit())
