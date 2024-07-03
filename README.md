# Patreon-api.ts

[![npm](https://img.shields.io/npm/v/patreon-api.ts)](https://www.npmjs.com/package/patreon-api.ts?activeTab=versions)
[![npm](https://img.shields.io/npm/dm/patreon-api.ts)](https://www.npmjs.com/package/patreon-api.ts?activeTab=readme)
[![GitHub issues](https://img.shields.io/github/issues/ghostrider-05/patreon-api.ts)](https://github.com/ghostrider-05/patreon-api.ts/issues/)
[![GitHub stars](https://img.shields.io/github/stars/ghostrider-05/patreon-api.ts?style=flat&label=stargazers)](https://github.com/ghostrider-05/patreon-api.ts/stars/)

Typescript library for the [V2 Patreon API](https://docs.patreon.com/) with [Typescript types](./examples/README.md) that strongly reflect your request.

```ts
// query: attributes[campaign]=title
const payload = await client.fetchCampaign(query)
    // ^? { data: { attributes: { title: string } }, ... }
```

## Installation

```sh
npm install patreon-api.ts
pnpm add patreon-api.ts
yarn add patreon-api.ts
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

While some features are highlighted below, you can read more in the [documentation](https://patreon-api.pages.dev). Still doubting if this library has everything you need related to the Patreon API? [Compare all libraries yourself](https://patreon-api.pages.dev/guide/introduction#why).

<details>
<summary>Compatibility</summary>

To check for compatibility with this package, look if your platform:

- has the globals: `AbortController`, `setTimeout`, `clearTimeout`, `fetch`, `URL` and `URLSearchParams`
  - for node.js: `v18` or higher
  - for Cloudflare workers: [enable Node.js](https://developers.cloudflare.com/workers/runtime-apis/nodejs/#enable-nodejs-with-workers)
- supports `ES2020`
- supports `createHmac` of the `node:crypto` module

> [!WARNING]
> This is a server-side API & Oauth package and requires your application tokens. Make sure you do not share or expose your tokens or run this code client-side.

</details>

### Clients

#### Creator token

If you don't need to handle Oauth2 requests, but only your own creator profile, the first example will get you started.
It is recommended to sync your token to your database or store it somewhere safe, so the token is not lost.

<details>
<summary>Example</summary>

```ts
import { PatreonCreatorClient, PatreonStore } from 'patreon-api.ts'

const creatorClient = new PatreonCreatorClient({
    oauth: {
        clientId: process.env.PATREON_CLIENT_ID!,
        clientSecret: process.env.PATREON_CLIENT_SECRET!,
        // Either set the token in the options
        // or configure a store and call <Client>.initialize()
        token: {
            access_token: process.env.PATREON_CREATOR_ACCESS_TOKEN!,
            refresh_token: process.env.PATREON_CREATOR_REFRESH_TOKEN!,
        },
    },
    store: new PatreonStore.Fetch('<url>'),
})
```

</details>

#### User oauth2

For handling Oauth2 requests, add `redirectUri` and if specified a `state` to the options.
Then fetch the token for the user with request url.
Note that for handling Oauth2 requests the client will not cache or store the tokens anywhere in case you need to refresh it!

<details>
<summary>Example</summary>

```ts
import { PatreonUserClient } from 'patreon-api.ts'

// Minimal configuration for handling Oauth2
const userClient = new PatreonUserClient({
    oauth: {
        clientId: process.env.PATREON_CLIENT_ID!,
        clientSecret: process.env.PATREON_CLIENT_SECRET!,
        redirectUri: '<uri>',
    }
})

export default {
    // The Oauth2 callback request with the code parameter
    fetch: async (request) => {
        const instance = await userClient.createInstance(request)
        await instance.fetchIdentity(<query>)
    }
}
```

</details>

### Store

There are 3 built-in methods of retreiving and storing tokens:

1. Manual loading and storing, see the example below
2. Fetch: use an external server that accepts `GET` and `PUT` requests
3. KV: store the (creator) token in a KV-like storage system (present on a lot of edge-runtimes).

<details>
<summary>Example</summary>

```ts
// Use stored tokens in a database
// And directly call the `store.get` method on starting the client
const storeClient = new PatreonCreatorClient({
    oauth: {
        clientId: process.env.PATREON_CLIENT_ID!,
        clientSecret: process.env.PATREON_CLIENT_SECRET!,
    },
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

</details>

### Webhooks

You can interact with the webhooks API using one of the [clients](#clients) above. This library also exposes functions to create a webhook server.

<details>
<summary>Example</summary>

```ts
import { parseWebhookRequest } from 'patreon-api.ts'

export default {
    async fetch (request, env) {
        const { verified, payload, event } = await parseWebhookRequest(request, env.WEBHOOK_SECRET)
        if (!verified) return new Response('Invalid request', { status: 403 })

        // handle your event
    }
}
```

</details>

## Examples

> [!NOTE]
> In API v2, [all attributes must be explicitly requested](https://docs.patreon.com/#apiv2-oauth).

- [Commonly used routes](./examples/README.md)
- [Example Cloudflare worker](./examples/cloudflare-webhook/)
- [Example Node.js server](./examples/nodejs-esm/)

## Changelog

Detailed changes are listed for each release in [the changelog](./CHANGELOG.md).

For upcoming releases, see [the roadmap](https://github.com/users/ghostrider-05/projects/5) for planned changes.

## Contributing

See the [code of conduct](./CODE_OF_CONDUCT.md) and the [contributing guide](./CONTRIBUTING.md) for how to contribute. You can also support the development by writing guides, posts and templates or by funding the maintainers.

## License

[MIT](./LICENSE)
