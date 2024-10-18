import type { Route } from '../../../../utils/openapi'

import campaign from './campaign'
import identity  from './identity'
import member from './member'
import post from './post'
import webhook from './webhook'

// Use the same order of endpoints on the Patreon documentation
export default [
    ...identity,
    ...campaign,
    ...member,
    ...post,
    ...webhook,
] as Route[]
