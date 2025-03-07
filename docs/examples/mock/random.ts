// @ts-expect-error duplicate-imports
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
// @ts-expect-error duplicate-imports
// #region resource-relationships
import { PatreonMockData, Type } from 'patreon-api.ts'

const data = new PatreonMockData()

const creatorId = data.createId(Type.User)
const campaignId = data.createId(Type.Campaign)

export const randomCampaignWithCreatorPayload = data.getSingleResponsePayload(
    Type.Campaign,
    {
        attributes: { campaign: ['patron_count'] },
        includes: ['creator'],
    }, {
        id: data.createId(Type.Campaign),
        item: data.random.campaign(campaignId),
        relatedItems: data.createRelatedItems(Type.Campaign, {
            items: [
                {
                    attributes: data.random.user(creatorId),
                    id: creatorId,
                    type: Type.User,
                }
            ]
        }),
    }
)
// #endregion resource-relationships