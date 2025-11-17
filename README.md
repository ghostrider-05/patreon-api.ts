# Patreon-api.ts

[![npm](https://img.shields.io/npm/v/patreon-api.ts)](https://www.npmjs.com/package/patreon-api.ts?activeTab=versions)
[![npm](https://img.shields.io/npm/dm/patreon-api.ts)](https://www.npmjs.com/package/patreon-api.ts?activeTab=readme)
[![GitHub issues](https://img.shields.io/github/issues/ghostrider-05/patreon-api.ts)](https://github.com/ghostrider-05/patreon-api.ts/issues/)
[![GitHub stars](https://img.shields.io/github/stars/ghostrider-05/patreon-api.ts?style=flat&label=stargazers)](https://github.com/ghostrider-05/patreon-api.ts/stargazers)

<!-- #region introduction -->

Typescript oauth library for the [V2 Patreon API](https://docs.patreon.com/) with:

- Support for Creator access tokens and oauth tokens
- Client with methods for calling every endpoint, both resource and webhook endpoints
- Methods to create a webhook server
- Typescript types that strongly reflect your query for raw or simplified responses

```ts
const query = QueryBuilder.campaign
    .setAttributes({ campaign: ['patron_count'] })

const payload = await client.fetchCampaign('campaign_id', query)
    // ^? { data: { attributes: { patron_count: number } }, ... }
const campaign = await client.simplified.fetchCampaign('campaign_id', query)
    // ^? { patronCount: number, id: string, type: Type.Campaign }
```

<!-- #endregion introduction -->

## Installation

```sh
npm install patreon-api.ts
pnpm add patreon-api.ts
yarn add patreon-api.ts
```

## Usage

<details>
<summary>Supported Patreon api: v2</summary>

<!-- #region api-versions -->
The default API version for this package is `2` and might change in major versions.

> [!CAUTION]
> This package does not include v1 of the Patreon API and starts with [API v2](https://docs.patreon.com/#apiv2-oauth). The sections in the Patreon documentation are prefixed by `APIv2:`. The Oauth flow, introduction and [sections below sorting](https://docs.patreon.com/#pagination-and-sorting) are related to all versions.

When the default API version is changed, old versions will still receive updates.
You can not import this module by API version since it is unlikely that Patreon will release a new version any time soon.

<!-- #endregion api-versions -->

</details>

To read more about how to use this library, go to the [documentation](https://patreon-api.pages.dev). Still doubting if this library has everything you need related to the Patreon API? [Compare all libraries yourself](https://patreon-api.pages.dev/guide/introduction#comparison).

<details>
<summary>Compatibility</summary>

<!-- #region compatibility -->

To check for compatibility with this package, look if your platform:

- has the globals: `AbortController`, `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`, `Request`, `fetch`, `URL` and `URLSearchParams`
  - for node.js: `v22` or higher
  - for Cloudflare workers: [enable Node.js](https://developers.cloudflare.com/workers/runtime-apis/nodejs/#enable-nodejs-with-workers)
- supports `ES2020`
- supports the `node:crypto` module: `createHmac` and `randomUUID`

<!-- #endregion compatibility -->

</details>

### OpenAPI schema

This library is used to create the Patreon OpenAPI schemas for the [`patreon-api-spec`](https://github.com/ghostrider-05/patreon-api-spec) repository.

## Examples

- [Commonly used routes](https://patreon-api.pages.dev/guide/features/request#routes) and [community apps](https://github.com/ghostrider-05/patreon-api.ts/discussions/categories/show-and-tell)
- Example webhook server: [Cloudflare worker](./examples/cloudflare-webhook/) and [express.js server](./examples/express-webhook/)
- Example Node.js server: [ESM](./examples/nodejs-esm/) and [CJS](./examples/nodejs-cjs/)

## Changelog

Detailed changes are listed for each release in [the changelog](./CHANGELOG.md).

For upcoming releases, see [the roadmap](https://github.com/users/ghostrider-05/projects/5) for planned changes.

## Contributing

<!-- #region contributing -->
See the [code of conduct](./CODE_OF_CONDUCT.md) and the [contributing guide](./CONTRIBUTING.md) for how to contribute. You can also support the development by writing guides, posts and templates or [by funding the maintainers](https://www.paypal.com/paypalme/05ghostrider).

Do you have a question about using this library? [Open a Q&A discussion on GitHub](https://github.com/ghostrider-05/patreon-api.ts/discussions/categories/q-a).

<!--- #endregion contributing -->

## License

[MIT](./LICENSE)

Copyright (c) 2023-present, ghostrider-05
