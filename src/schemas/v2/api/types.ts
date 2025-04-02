import type {
    PatreonOauthScope,
    RequestMethod,
} from '../../../rest/v2/'

import type { Type } from '../item'

export interface Route {
    route:
        | ((id: string) => string)
        | (() => string)
    resource: Type
    description?: string
    summary?: string
    tags: string[]
    scopes?: PatreonOauthScope[]
    params?: {
        id?: string
    }
    response?: {
        array?: boolean
        status?: number
    }
    methods: {
        method: RequestMethod
        id: string
        body?: Record<string, unknown>
        deprecated?: boolean
        description?: string
        experimental?: boolean
        scopes?: PatreonOauthScope[]
        summary?: string
        responseStatus?: number
    }[]
}
