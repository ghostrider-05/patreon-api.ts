import type { Optional } from '../../utils/'

import {
    PatreonClient,
    type PatreonClientOptions,
} from './base'

export type PatreonCreatorClientOptions<IncludeAll extends boolean = false> = Optional<
    Omit<PatreonClientOptions<IncludeAll>, 'oauth'> & {
        oauth: Optional<PatreonClientOptions<IncludeAll>['oauth'], 'clientId' | 'clientSecret'>
    }, 'oauth'
>

export class PatreonCreatorClient<IncludeAll extends boolean = false> extends PatreonClient<IncludeAll> {
    public constructor (options: PatreonCreatorClientOptions<IncludeAll>) {
        super({
            ...options,
            oauth: {
                clientId: null,
                clientSecret: null,
                tokenType: 'creator',
                ...options.oauth,
            },
        })
    }
}
