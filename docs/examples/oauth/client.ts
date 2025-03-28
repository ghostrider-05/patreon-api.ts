// #region custom
import { PatreonClient } from 'patreon-api.ts'

// Can also extend a creator or user client
export class MyCampaignClient extends PatreonClient {
    public campaignId: string = '<id>'

    public async fetch () {
        return await this.fetchCampaign(this.campaignId)
    }
}
// #endregion custom

// #region wrapper
import { PatreonCreatorClient } from 'patreon-api.ts'

declare const env: {
    CLIENT_ID: string
    CLIENT_SECRET: string
}

export class Patreon {
    public client: PatreonCreatorClient<true>
    public campaignId: string

    public constructor (campaignId: string) {
        this.campaignId = campaignId

        this.client = new PatreonCreatorClient({
            oauth: {
                clientId: env.CLIENT_ID,
                clientSecret: env.CLIENT_SECRET,
            },
            rest: {
                includeAllQueries: true,
            },
        })
    }

    public async fetch () {
        return await this.client.simplified.fetchCampaign(this.campaignId)
    }

    public async fetchMembers () {
        return await this.client.simplified.fetchCampaignMembers(this.campaignId)
    }

    public async fetchPosts () {
        return await this.client.simplified.fetchCampaignPosts(this.campaignId)
    }
}
// #endregion wrapper