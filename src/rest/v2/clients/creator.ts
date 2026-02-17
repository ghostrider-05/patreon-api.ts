import type { Oauth2StoredToken } from '../oauth2/'

import {
    PatreonClient,
    type PatreonClientOptions,
} from './base'

export class PatreonCreatorClient<IncludeAll extends boolean = false> extends PatreonClient<IncludeAll> {
    public constructor (options: PatreonClientOptions<IncludeAll>) {
        super(options, 'creator')
    }

    /**
     * Calls {@link PatreonCreatorClient.fetchApplicationToken}.
     * @returns Whether the call was successful or not
     * @deprecated Use the `CacheTokenStore` class to store and fetch any tokens.
     * See the documentation for an example: https://patreon-api.pages.dev/guide/features/oauth#creator-token
     */
    public async initialize(): Promise<boolean> {
        const token = await this.fetchApplicationToken()

        return token.success
    }

    /**
     * Fetch the current application token from the configured store and updates the token.
     * @returns
     * if the token is updated and stored, and the token
     * @deprecated Use the `CacheTokenStore` class to store and fetch any tokens.
     * See the documentation for an example: https://patreon-api.pages.dev/guide/features/oauth#creator-token
     */
    public async fetchApplicationToken(): Promise<
        | { success: true, token: Oauth2StoredToken }
        | { success: false, token: undefined }
        >
    {
        const stored = await PatreonClient.fetchStored(this['store'])
        if (!stored) return { success: false, token: undefined }

        const updated = await this.oauth.refreshToken(stored)
        await this.oauth.onTokenRefreshed?.(updated)

        return {
            success: updated != undefined,
            token: updated,
        } as
            | { success: true, token: Oauth2StoredToken }
            | { success: false, token: undefined }
    }
}