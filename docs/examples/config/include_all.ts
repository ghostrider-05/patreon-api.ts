// @ts-expect-error duplicate-imports
// #region config
import { PatreonCreatorClient } from 'patreon-api.ts'

const client = new PatreonCreatorClient({
    oauth: {
        clientId: 'id',
        clientSecret: 'secret',
    },
    rest: {
        includeAllQueries: true,
    }
})
// #endregion config
// @ts-expect-error duplicate-imports
// #region difference
import { PatreonCreatorClient } from 'patreon-api.ts'

declare const enabledClient: PatreonCreatorClient<true>
declare const disabledClient: PatreonCreatorClient

const completeCampaign = await enabledClient.fetchCampaign('id')
console.log(completeCampaign.data.attributes.patron_count)

const emptyCampaign = await disabledClient.fetchCampaign('id')
console.log(emptyCampaign.data.attributes)
// #endregion difference