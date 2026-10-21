import {
    PatreonClient,
    type PatreonClientOptions,
} from './base'

export class PatreonCreatorClient<IncludeAll extends boolean = false> extends PatreonClient<IncludeAll> {
    public constructor (options: PatreonClientOptions<IncludeAll>) {
        options.oauth.tokenType ??= 'creator'

        super(options)
    }
}
