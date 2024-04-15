import { BasePatreonClient, StoredToken } from './base'

export class PatreonCreatorClient extends BasePatreonClient {
    /**
     * Calls {@link PatreonCreatorClient.fetchApplicationToken}.
     * @returns {Promise<boolean>} Whether the call was successful or not
     */
    public async initialize(): Promise<boolean> {
        const token = await this.fetchApplicationToken()

        return token.success
    }

    /**
     * Fetch the current application token from the configured store and updates the token.
     * @returns {{ success: true, token: StoredToken } | { success: false, token: undefined }}
     * if the token is updated and stored, and the token
     */
    public async fetchApplicationToken(): Promise<
        | { success: true, token: StoredToken }
        | { success: false, token: undefined }
        >
    {
        const stored = await BasePatreonClient.fetchStored(this['store'])
        if (!stored) return { success: false, token: undefined }

        const updated = await this.oauth.refreshToken(stored)
        return {
            success: updated != undefined,
            token: updated,
        } as
            | { success: true, token: StoredToken }
            | { success: false, token: undefined }
    }
}