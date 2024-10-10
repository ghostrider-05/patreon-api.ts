import {
    Oauth2Routes,
    RequestMethod,
    Type,
} from '../../../../v2'
import type { Route } from '../types/paths'

const resource = Type.User
const tags = [
    'resource',
]

export default [
    {
        route: Oauth2Routes.identity,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Get,
                id: 'getIdentity',
            },
        ],
    },
] satisfies Route[]
