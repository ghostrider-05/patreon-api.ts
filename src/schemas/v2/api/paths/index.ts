import type { Route } from '../../../../utils/openapi'

import campaign from './campaign'
import identity  from './identity'
import member from './member'
import post from './post'
import webhook from './webhook'

export default [
    ...campaign,
    ...identity,
    ...member,
    ...post,
    ...webhook,
] as Route[]
