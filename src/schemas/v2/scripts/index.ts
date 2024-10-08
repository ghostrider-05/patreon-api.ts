import { writeSchema } from './api'
import { syncResourceKeys } from './keys'
import { syncRelationships } from './relationships'

// eslint-disable-next-line jsdoc/require-jsdoc
async function syncSchemas () {
    await syncResourceKeys()
    await syncRelationships()

    await writeSchema()

    process.exit(0)
}

syncSchemas()
