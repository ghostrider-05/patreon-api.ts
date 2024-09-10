import { syncResourceKeys } from './keys'
import { syncRelationships } from './relationships'

// eslint-disable-next-line jsdoc/require-jsdoc
async function syncSchemas () {
    await syncResourceKeys()
    await syncRelationships()

    process.exit(0)
}

syncSchemas()
