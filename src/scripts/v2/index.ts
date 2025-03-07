import { syncResourceKeys } from './keys'
import { syncRelationships } from './relationships'
import { syncRandomData } from './random'
import { syncResourceSchemas } from './schemas'

// eslint-disable-next-line jsdoc/require-jsdoc
async function syncSchemas () {
    await syncResourceKeys()
    await syncRelationships()
    await syncResourceSchemas()

    await syncRandomData()

    process.exit(0)
}

syncSchemas()
