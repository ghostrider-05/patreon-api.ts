import { PatreonOauthScope, RequestMethod, Type } from '../../../../v2'

export interface Route {
    route:
        | ((id: string) => string)
        | (() => string)
    resource: Type
    tags: string[]
    scopes?: PatreonOauthScope[]
    params?: {
        id: string | null
    }
    response?: {
        array?: boolean
    }
    methods: {
        method: RequestMethod
        id: string
        body?: Record<string, unknown>
    }[]
}
