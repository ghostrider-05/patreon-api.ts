import { BasePatreonClient } from './base'

export class PatreonCreatorClient extends BasePatreonClient {
    public async initialize(): Promise<boolean> {
        return await this.fetchApplicationToken()
            .then(res => res.success)
    }

    /**
     * @returns if the token is updated and stored, and the token
     */
    public override async fetchApplicationToken() {
        return await this.oauthClient._fetchToken('', 'credentials', true)
            .then(raw => ({ success: raw != undefined, token: BasePatreonClient.toStored(raw) }))
    }
}