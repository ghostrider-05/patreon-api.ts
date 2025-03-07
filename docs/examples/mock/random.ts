// #region resource
import { PatreonMockData, Type } from 'patreon-api.ts'

const data = new PatreonMockData({
    // Overwrite attributes to be fixed values
    // Or specify your own random methods
    resources: {
        campaign() {
            return {
                is_monthly: true,
            }
        },
    }
})

const randomId = data.createId(Type.Campaign)
const randomCampaign = data.random.campaign(randomId)

export const randomCampaignPayload = data.getSingleResponsePayload(
    Type.Campaign,
    {
        attributes: { campaign: ['patron_count'] },
        includes: [],
    }, {
        id: randomId,
        item: randomCampaign,
        relatedItems: [],
    }
)

// #endregion resource
// #region resource-relationships
import { PatreonMockData, Type } from 'patreon-api.ts'

const data = new PatreonMockData()

export const randomCampaignWithCreatorPayload = data.getSingleResponsePayload(
    Type.Campaign,
    {
        attributes: { campaign: ['patron_count'] },
        includes: ['creator'],
    }, {
        id: data.createId(Type.Campaign),
        item: randomCampaign,
        relatedItems: data.createRelatedItems(Type.Campaign, {
            items: [
                data.getAttributeItem(Type.User, data.createId(Type.User))
            ]
        }),
    }
)
// #endregion resource-relationships