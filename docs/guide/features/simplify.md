# Normalized responses

> [!WARNING]
> This is WIP, see [#26](https://github.com/ghostrider-05/patreon-api.ts/issues/26)

The Patreon API returns data in the [JSON:API]() format with the data spread over `attributes`, `relationships` and `included` fields.

## normalized


## simplified

The `simplify` method will both [normalize](#normalized) the response and convert all keys to camelCase.

```ts
import { simplify } from 'patreon-api.ts'

const query = buildQuery.campaign(['creator'])({ creator: ['full_name'], campaign: ['created_at' ]})
const rawCampaign = await <Client>.fetchCampaign('campaign_id', query)

const campaign = simplify(rawCampaign)
console.log(`Campaign by ${campaign.creator.fullName} created at ${campaign.createdAt}`)
```
