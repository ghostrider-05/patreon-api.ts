import {
    Routes,
    RequestMethod,
} from '../../../../rest/v2/'

import { Type } from '../../item'
import type { Route } from '../types'

const resource = Type.User
const tags = [
    'Resources',
]

export default [
    {
        route: Routes.identity,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Get,
                id: <const>'getIdentity',
            },
        ],
    },
] satisfies Route[]
