# Oauth routes

## Fetch campaigns

```ts
import { buildQuery } from 'patreon-api.ts'

const query = buildQuery.campaigns()({
    // Include number of patrons for each campaign
    campaign: ['patron_count']
})

const campaigns = await <Client>.fetchCampaigns(query)
console.log('The first campaign id of the current user is: ' + campaigns?.data[0].id)
```

You can also use `list*` methods to iterate paginated requests:

```ts
import { buildQuery } from 'patreon-api.ts'

const query = buildQuery.campaigns()({
    // Include number of patrons for each campaign
    campaign: ['patron_count']
})

const campaigns = <Client>.listCampaigns(query)

for await (const campaign of <Client>.listCampaigns(query)) {
    console.log('Campaign id: ' + campaign.data[0].id)
}
```

## Fetch single campaign

```ts
import { Type, buildQuery, type AttributeItem } from 'patreon-api.ts'

// Fetch all campaigns first, or look at the network tab to find the id
const campaignId = '<id>'

// Use the `include` option to request more relationships, like `tiers`
// When included, you can add attributes to the relationships
const campaignQuery = buildQuery.campaign(['tiers'])({
    tier: ['amount_cents', 'title']
})
const campaign = await <Client>.fetchCampaign(campaignId, campaignQuery)

if (campaign != undefined) {
    // Filter all but tiers and get the attributes
    const tiers = campaign.included
        .filter((item): item is AttributeItem<Type.Tier, typeof item['attributes']> => item.type === Type.Tier)
        .map(item => item.attributes)

    // Type: { title: string, amount_cents: number }[]
    console.log(tiers)
}
```
