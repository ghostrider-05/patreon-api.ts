import { mkdir } from 'node:fs/promises'

import writeSchema from './api'

(async () => {
    const folder = process.env['OPENAPI_FOLDER'] ?? './tsc-generated/openapi/'
    if (!folder) throw new Error()

    await mkdir(folder)

    await writeSchema(folder + 'openapi.json', false)
    await writeSchema(folder + 'openapi_preview.json', true)
})()
