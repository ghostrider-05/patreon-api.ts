# Patreon TS

![npm](https://img.shields.io/npm/v/patreon-api.ts)
![npm](https://img.shields.io/npm/dm/patreon-api.ts)
![GitHub issues](https://img.shields.io/github/issues/ghostrider-05/patreon-api.ts)

Typescript library for the V2 [Patreon API](https://docs.patreon.com/)

> You might be looking for [patreon-js](https://github.com/Patreon/patreon-js) for JavaScript, [patreon-api-types](https://github.com/mrTomatolegit/patreon-api-types) for less strict types and no client or another package in between.

## Installation

```sh
npm install patreon-api.ts
```

## Usage

> [!CAUTION]
> This package does not include v1 of the Patreon API and starts with [API v2](https://docs.patreon.com/#apiv2-oauth)

The default API version for this package is `2` and might change in major versions.
When the default API version is changed, old versions will still receive updates.
You can not import this module by API version since it is unlikely that Patreon will release a new version any time soon.

```ts
import { type Campaign } from 'patreon-api.ts';
```

### Platform

To check for compatibility with this package, look if your platform:

- has the globals: `fetch`, `URL` and `URLSearchParams`
  - for node.js: `v18` or higher
- supports `ES2020`

### Oauth2 vs Creator token

#### Creator token

If you don't need to handle Oauth2 requests, but only your own creator profile, the first example will get you started.
It is recommended to sync your token to your database or store it somewhere safe, so the token is not lost.

```ts
import { PatreonCreatorClient, PatreonStore } from 'patreon-api.ts'

const creatorClient = new PatreonCreatorClient({
    clientId: process.env.PATREON_CLIENT_ID!,
    clientSecret: process.env.PATREON_CLIENT_SECRET!,
    store: new PatreonStore.Fetch('<url>'),
})

// Use the token of the creator with the current app, instead of Oauth2 callback
// Will call store.put, to sync it with an external DB
// After fetching, you can directly call the V2 API and the token is stored with store.put
await creatorClient.initialize()
```

#### User oauth2

For handling Oauth2 requests, add `redirectUri` and if specified a `state` to the options.
Then fetch the token for the user with request url.
Note that for handling Oauth2 requests the client will not cache or store the tokens anywhere in case you need to refresh it!

```ts
import { PatreonUserClient } from 'patreon-api.ts'

// Minimal configuration for handling Oauth2
const userClient = new PatreonUserClient({
    clientId: process.env.PATREON_CLIENT_ID!,
    clientSecret: process.env.PATREON_CLIENT_SECRET!,
    redirectUri: '<uri>',
})

export default {
    // The Oauth2 callback request with the code parameter
    fetch: async (request) => {
        const instance = await userClient.createInstance(request)
        await instance.fetchIdentity(<query>)
    }
}
```

### Store

There are 3 built-in methods of retreiving and storing tokens:

1. Manual loading and storing, see the example below
2. Fetch: use an external server that accepts `GET` and `PUT` requests
3. KV: store the (creator) token in a KV-like storage system (present on a lot of edge-runtimes).

```ts
// Use stored tokens in a database
// And directly call the `store.get` method on starting the client
const storeClient = new PatreonCreatorClient({
    clientId: process.env.PATREON_CLIENT_ID!,
    clientSecret: process.env.PATREON_CLIENT_SECRET!,
    name: '<application>', // The application name in the dashboard
    store: {
        get: async () => {
            // Get your stored token
            return <never>{
                access_token: '<token>',
                //...refresh, expires, etc.
            }
        },
        put: async (token) => {
            console.log(JSON.stringify(token))
        }
    }
})
```

## Examples

> [!NOTE]
> In API v2, [all attributes must be explicitly requested](https://docs.patreon.com/#apiv2-oauth).

### Fetch campaigns

```ts
import { buildQuery } from 'patreon-api.ts'

const query = buildQuery.campaigns()({
    // Include number of patrons for each campaign
    campaign: ['patron_count']
})

const campaigns = await <Client>.fetchCampaigns(query)
console.log('The first campaign id of the current user is: ' + campaigns?.data[0].id)
```

### Fetch single campaign

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
