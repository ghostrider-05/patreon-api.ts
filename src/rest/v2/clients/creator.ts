import { BasePatreonClient, StoredToken } from './base'

export class PatreonCreatorClient extends BasePatreonClient {
    public async initialize(): Promise<boolean> {
        const token = await this.fetchApplicationToken()

        return token != undefined
    }

    /**
     * @returns if the token is updated and stored, and the token
     */
    public async fetchApplicationToken(): Promise<
        | { success: true, token: StoredToken }
        | { success: false, token: undefined }
        >
    {
        const stored = await BasePatreonClient.fetchStored(this['store'])
        if (!stored) return { success: false, token: undefined }

        const updated = await this.oauthClient.refreshToken(stored)
        return {
            success: updated != undefined,
            token: updated,
        } as
            | { success: true, token: StoredToken }
            | { success: false, token: undefined }
    }
}