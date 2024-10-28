import { syncResourceKeys } from './keys'
import { syncRelationships } from './relationships'
import { syncResourceSchemas } from './schemas'

// eslint-disable-next-line jsdoc/require-jsdoc
async function syncSchemas () {
    await syncResourceKeys()
    await syncRelationships()
    await syncResourceSchemas()

    process.exit(0)
}

syncSchemas()
