import { mkdir } from 'node:fs/promises'

import writeSchema from './api'

(async () => {
    const folder = process.env['OPENAPI_FOLDER'] ?? './tsc-generated/openapi/'
    if (!folder) throw new Error()

    try {
        await mkdir(folder)
    } catch {
        // Dir already exists or something is really wrong
    }

    await writeSchema(folder + 'openapi.json', false)
    await writeSchema(folder + 'openapi_preview.json', true)
})()
