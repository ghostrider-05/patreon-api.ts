import { syncResourceKeys } from './keys'
import { syncRelationships } from './relationships'

syncResourceKeys()
    .then(syncRelationships)
    .then(() => process.exit(0))
