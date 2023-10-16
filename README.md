# Patreon TS

Typescript library for the V2 [Patreon API](https://docs.patreon.com/)

## Installation

> **Warning**
> You might be looking for [patreon-js](https://github.com/Patreon/patreon-js) for JavaScript, [patreon-api-types](https://github.com/mrTomatolegit/patreon-api-types) for less strict types and no client or another package in between.

```sh
npm install patreon-api.ts
```

## Usage

> **Warning**
> This package does not include v1 of the Patreon API and starts with [API v2](https://docs.patreon.com/#apiv2-oauth)

The default API version for this package is `2` and might change in major versions.
When the default API version is changed, old versions will still receive updates.
You can not import this module by API version since it is unlikely that Patreon will release a new version any time soon.

```ts
import { Campaign } from 'patreon-api.ts';
```

```ts
const { Campaign } = require('patreon-api.ts');
```

### Platform

Before deploying this, check that:

- [ ] In the example below, `fetch` is replaced with the fetch function of your platform.
- [ ] your platform supports ES5+

### Oauth2 vs Creator token

If you don't need to handle Oauth2 requests, but only your own creator profile, the first example will get you started.
It is recommended to sync your token to your database or store it somewhere safe, so the token is not lost.

> If you don't plan to use the application name on the client, set the option `name` to an empty string.

```ts
import { PatreonClient } from 'patreon-api.ts'

// Use stored tokens in a database
// And directly call the `store.get` method on starting the client
const storeClient = await PatreonClient.initialize({
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
}, fetch)

// Use the token of the creator with the current app, instead of Oauth2 callback
// Will call options.store.put, to sync it with an external DB
// If you did not construct the client with `PatreonClient.initialize`, fetch the token.
// After fetching, you can directly call the V2 API and the token is stored with options.store.put
// await storeClient.fetchApplicationToken()
```

For handling Oauth2 requests, add `redirectUri` and if specified a `state` to the options.
Then fetch the token for the user with request url.
Note that for handling Oauth2 requests the client will not cache or store the tokens anywhere in case you need to refresh it!

```ts
import { PatreonClient } from 'patreon-api.ts'

// Minimal configuration for handling Oauth2
const codeClient = new PatreonClient({
    clientId: process.env.PATREON_CLIENT_ID!,
    clientSecret: process.env.PATREON_CLIENT_SECRET!,
    name: '<application>', // The application name in the dashboard
    redirectUri: '<uri>',
}, fetch)

// Use the client to handle an incoming request
// Use this token to bind it in your DB to a specific user, store it, etc.
const token = await codeClient.fetchToken('request.url')

// Or if you have the token already somewhere loaded, pass the option directly:
const manualCodeClient = new PatreonClient({
    clientId: process.env.PATREON_CLIENT_ID!,
    clientSecret: process.env.PATREON_CLIENT_SECRET!,
    name: '<application>', // The application name in the dashboard
    redirectUri: '<uri>',
}, fetch, {
    access_token: '<access_token>',
    expires_in: '<seconds>',
    refresh_token: '<refresh_token>',
    token_type: 'Bearer',
})
```

## Examples

> **Info**
> In API v2, [all attributes must be explicitly requested](https://docs.patreon.com/#apiv2-oauth).

### Fetch campaigns

```ts
import { Oauth2Routes, buildQuery } from 'patreon-api.ts'

const query = buildQuery.campaigns()({
    // Include number of patrons for each campaign
    campaign: ['patron_count']
})

const campaigns = await <Client>.fetchOauth2(Oauth2Routes.campaigns(), query)
console.log('The first campaign id of the current user is: ' + campaigns?.data[0].id)
```

### Fetch single campaign

```ts
import { Oauth2Routes, Type, buildQuery, type AttributeItem } from 'patreon-api.ts'

// Fetch all campaigns first, or look at the network tab to find the id
const campaignId = '<id>'

// Use the `include` option to request more relationships, like `tiers`
// When included, you can add attributes to the relationships
const campaignQuery = buildQuery.campaign(['tiers'])({
    tier: ['amount_cents', 'title']
})
const campaign = await <Client>.fetchOauth2(Oauth2Routes.campaign(campaignId), campaignQuery)

if (campaign != undefined) {
    // Filter all but tiers and get the attributes
    const tiers = campaign.included
        .filter((item): item is AttributeItem<Type.Tier, typeof item['attributes']> => item.type === Type.Tier)
        .map(item => item.attributes)

    // Type: { title: string, amount_cents: number }[]
    console.log(tiers)
}
```
