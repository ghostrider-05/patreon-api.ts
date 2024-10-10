import { writeOpenAPISchema } from './api'
import { syncResourceKeys } from './keys'
import { syncRelationships } from './relationships'

// eslint-disable-next-line jsdoc/require-jsdoc
async function syncSchemas () {
    await syncResourceKeys()
    await syncRelationships()

    await writeOpenAPISchema({
        fileName: './openapi.json',
        spacing: 2,
    })

    process.exit(0)
}

syncSchemas()
