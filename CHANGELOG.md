# Changelog

## [0.7.0](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.6.1...patreon-api.ts-v0.7.0) (2024-09-06)


### Features

* add documentation (closes [#40](https://github.com/ghostrider-05/patreon-api.ts/issues/40)) ([#46](https://github.com/ghostrider-05/patreon-api.ts/issues/46)) ([521b29e](https://github.com/ghostrider-05/patreon-api.ts/commit/521b29e0d0ff97fd7f3895be82983009147866cb))
* add experimental support for normalized responses ([#53](https://github.com/ghostrider-05/patreon-api.ts/issues/53)) ([242587d](https://github.com/ghostrider-05/patreon-api.ts/commit/242587d66b20a2bdd6eca59c75dad637e1585b59))
* export keys from schemas and relationships ([521b29e](https://github.com/ghostrider-05/patreon-api.ts/commit/521b29e0d0ff97fd7f3895be82983009147866cb))
* **PatreonOauthClient:** add paginate and fetch to client from static methods ([bbf4d2f](https://github.com/ghostrider-05/patreon-api.ts/commit/bbf4d2f11a4d9b2529b0c0ce24a3ac45c64e0052))
* **rest:** add timeout option to client ([242587d](https://github.com/ghostrider-05/patreon-api.ts/commit/242587d66b20a2bdd6eca59c75dad637e1585b59))


### Bug Fixes

* correct included query for address, campaign and tier ([521b29e](https://github.com/ghostrider-05/patreon-api.ts/commit/521b29e0d0ff97fd7f3895be82983009147866cb))
* **PatreonClient:** do not overwrite options.rest.getAccessToken if specified ([bbf4d2f](https://github.com/ghostrider-05/patreon-api.ts/commit/bbf4d2f11a4d9b2529b0c0ce24a3ac45c64e0052))
* **PatreonClient:** round StoredToken.expires_in to seconds when fetched from store ([bbf4d2f](https://github.com/ghostrider-05/patreon-api.ts/commit/bbf4d2f11a4d9b2529b0c0ce24a3ac45c64e0052))
* **PatreonOauthClient:** correctly use cursor for paginating ([242587d](https://github.com/ghostrider-05/patreon-api.ts/commit/242587d66b20a2bdd6eca59c75dad637e1585b59))
* **PatreonOauthClient:** remove undefined from return types ([242587d](https://github.com/ghostrider-05/patreon-api.ts/commit/242587d66b20a2bdd6eca59c75dad637e1585b59))

## [0.6.1](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.6.0...patreon-api.ts-v0.6.1) (2024-06-27)


### Bug Fixes

* **build:** add node: prefix to node packages ([d85fb54](https://github.com/ghostrider-05/patreon-api.ts/commit/d85fb547b2f0dc694b82a7fee2869c3b8a1b151d))
* **build:** move to tsup and fix esm exports ([d85fb54](https://github.com/ghostrider-05/patreon-api.ts/commit/d85fb547b2f0dc694b82a7fee2869c3b8a1b151d))
* **ci:** fix test command ([39b7251](https://github.com/ghostrider-05/patreon-api.ts/commit/39b72515d509dd2a1992b63beab558518fb3408a))
* **ci:** update release action ([#36](https://github.com/ghostrider-05/patreon-api.ts/issues/36)) ([062c4c0](https://github.com/ghostrider-05/patreon-api.ts/commit/062c4c0edd5e6a10cc8e533a8f209ac8de13f0ba))
* **ci:** update tests labeler ([39b7251](https://github.com/ghostrider-05/patreon-api.ts/commit/39b72515d509dd2a1992b63beab558518fb3408a))
* **examples:** use workspace package ([d85fb54](https://github.com/ghostrider-05/patreon-api.ts/commit/d85fb547b2f0dc694b82a7fee2869c3b8a1b151d))
* **examples:** working html to markdown in webhook worker ([#38](https://github.com/ghostrider-05/patreon-api.ts/issues/38)) ([d85fb54](https://github.com/ghostrider-05/patreon-api.ts/commit/d85fb547b2f0dc694b82a7fee2869c3b8a1b151d))
* **lint:** resolve eslint errors ([#35](https://github.com/ghostrider-05/patreon-api.ts/issues/35)) ([39b7251](https://github.com/ghostrider-05/patreon-api.ts/commit/39b72515d509dd2a1992b63beab558518fb3408a))

## [0.6.0](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.5.0...patreon-api.ts-v0.6.0) (2024-05-10)


### ⚠ BREAKING CHANGES

* removes useDefaultIncludes from query options
* remove all deprecations ([#22](https://github.com/ghostrider-05/patreon-api.ts/issues/22))

### Features

* remove all deprecations ([#22](https://github.com/ghostrider-05/patreon-api.ts/issues/22)) ([41dff99](https://github.com/ghostrider-05/patreon-api.ts/commit/41dff99004a6059f85da1457895b4acd7b425a20))
* removes useDefaultIncludes from query options ([41dff99](https://github.com/ghostrider-05/patreon-api.ts/commit/41dff99004a6059f85da1457895b4acd7b425a20))


### Bug Fixes

* **oauth:** send body on requests ([41dff99](https://github.com/ghostrider-05/patreon-api.ts/commit/41dff99004a6059f85da1457895b4acd7b425a20))
* **webhooks:** update editWebhook to work correctly ([41dff99](https://github.com/ghostrider-05/patreon-api.ts/commit/41dff99004a6059f85da1457895b4acd7b425a20))

## [0.5.0](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.4.0...patreon-api.ts-v0.5.0) (2024-05-10)


### ⚠ BREAKING CHANGES

* **types:** remove `Fetch` and `Response`
* **BasePatreonClient:** `listOauth2` returns the amount of pages
* **PatreonOauthClient:** deprecate `fetch` and `retryOnFailed` on client and options. Deprecate `userAgent` option

### Features

* add rest client ([#18](https://github.com/ghostrider-05/patreon-api.ts/issues/18)) ([af4fdb1](https://github.com/ghostrider-05/patreon-api.ts/commit/af4fdb1b2f2812fae3e8ccfc555967fc3de3b64e))
* **BasePatreonClient:** `listOauth2` returns the amount of pages ([af4fdb1](https://github.com/ghostrider-05/patreon-api.ts/commit/af4fdb1b2f2812fae3e8ccfc555967fc3de3b64e))
* **oauth:** add `createOauthUri` for creating `oauthUri` ([af4fdb1](https://github.com/ghostrider-05/patreon-api.ts/commit/af4fdb1b2f2812fae3e8ccfc555967fc3de3b64e))
* **oauth:** add `validateToken` option ([af4fdb1](https://github.com/ghostrider-05/patreon-api.ts/commit/af4fdb1b2f2812fae3e8ccfc555967fc3de3b64e))
* **oauth:** improve creator token flow ([af4fdb1](https://github.com/ghostrider-05/patreon-api.ts/commit/af4fdb1b2f2812fae3e8ccfc555967fc3de3b64e))
* **PatreonOauthClient:** deprecate `fetch` and `retryOnFailed` on client and options. Deprecate `userAgent` option ([af4fdb1](https://github.com/ghostrider-05/patreon-api.ts/commit/af4fdb1b2f2812fae3e8ccfc555967fc3de3b64e))
* **types:** remove `Fetch` and `Response` ([af4fdb1](https://github.com/ghostrider-05/patreon-api.ts/commit/af4fdb1b2f2812fae3e8ccfc555967fc3de3b64e))


### Bug Fixes

* **PatreonUserClientInstance:** correct discord id instead of object ([af4fdb1](https://github.com/ghostrider-05/patreon-api.ts/commit/af4fdb1b2f2812fae3e8ccfc555967fc3de3b64e))
* **types:** add `null` to User.social_connections values ([af4fdb1](https://github.com/ghostrider-05/patreon-api.ts/commit/af4fdb1b2f2812fae3e8ccfc555967fc3de3b64e))

## [0.4.0](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.3.0...patreon-api.ts-v0.4.0) (2024-04-17)


### ⚠ BREAKING CHANGES

* **oauth:** move options to `PatreonClientOptions.oauth`
* **oauth:** deprecate `Oauth2FetchOptions`.`refreshOnFailed` for `retryOnFailed`
* **BasePatreonClient:** remove deprecated `fetchToken`, `putToken` and `fetchApplicationToken`
* **PatreonCreatorClient:** correctly type return type of `fetchApplicationToken`
* **PatreonUserClient:** correctly type return of `fetchToken`
* remove oauth client dependency ([#13](https://github.com/ghostrider-05/patreon-api.ts/issues/13))

### Features

* add pagination options to query builder ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))
* add raw search params to query builder output ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))
* **BasePatreonClient:** remove deprecated `fetchToken`, `putToken` and `fetchApplicationToken` ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))
* **client:** add options to overwrite oauth uris ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))
* **client:** add userAgent option ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))
* export package version ([16972b8](https://github.com/ghostrider-05/patreon-api.ts/commit/16972b8fef79bb67329c124551a54a2555ea8a16))
* **oauth:** add getter for redirect uri ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))
* **oauth:** add listing methods to clients ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))
* **oauth:** add patreon API scopes ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))
* **oauth:** deprecate `Oauth2FetchOptions`.`refreshOnFailed` for `retryOnFailed` ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))
* **oauth:** expose oauth client ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))
* **oauth:** move options to `PatreonClientOptions.oauth` ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))
* remove oauth client dependency ([#13](https://github.com/ghostrider-05/patreon-api.ts/issues/13)) ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))
* **webhooks:** add server functions for verifying and parsing requests ([16972b8](https://github.com/ghostrider-05/patreon-api.ts/commit/16972b8fef79bb67329c124551a54a2555ea8a16))
* **webhooks:** add support for API webhooks ([#17](https://github.com/ghostrider-05/patreon-api.ts/issues/17)) ([16972b8](https://github.com/ghostrider-05/patreon-api.ts/commit/16972b8fef79bb67329c124551a54a2555ea8a16))


### Bug Fixes

* **PatreonCreatorClient:** correctly type return type of `fetchApplicationToken` ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))
* **PatreonUserClient:** correctly type return of `fetchToken` ([d4e79bc](https://github.com/ghostrider-05/patreon-api.ts/commit/d4e79bc969090a724d0ce0d1a7dda7e71110ddfb))

## [0.3.0](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.2.0...patreon-api.ts-v0.3.0) (2024-04-11)


### ⚠ BREAKING CHANGES

* **PatreonUserClientInstance:** set token to readonly
* **types:** narrow type of `User.social_connections` to `Record<string, string>`
* update oauth clients and minimal node version ([#11](https://github.com/ghostrider-05/patreon-api.ts/issues/11))

### Features

* **oauth:** add methods to fetch resources ([60ea00b](https://github.com/ghostrider-05/patreon-api.ts/commit/60ea00b9a78cf3cf18f02dd5e6e1b533284bf2ce))
* **PatreonUserClientInstance:** add `fetchDiscordId` method ([60ea00b](https://github.com/ghostrider-05/patreon-api.ts/commit/60ea00b9a78cf3cf18f02dd5e6e1b533284bf2ce))
* **PatreonUserClientInstance:** set token to readonly ([60ea00b](https://github.com/ghostrider-05/patreon-api.ts/commit/60ea00b9a78cf3cf18f02dd5e6e1b533284bf2ce))
* **types:** narrow type of `User.social_connections` to `Record&lt;string, string&gt;` ([60ea00b](https://github.com/ghostrider-05/patreon-api.ts/commit/60ea00b9a78cf3cf18f02dd5e6e1b533284bf2ce))
* update oauth clients and minimal node version ([#11](https://github.com/ghostrider-05/patreon-api.ts/issues/11)) ([60ea00b](https://github.com/ghostrider-05/patreon-api.ts/commit/60ea00b9a78cf3cf18f02dd5e6e1b533284bf2ce))


### Bug Fixes

* **oauth:** use https protocol for URL ([60ea00b](https://github.com/ghostrider-05/patreon-api.ts/commit/60ea00b9a78cf3cf18f02dd5e6e1b533284bf2ce))
* update repository url ([#3](https://github.com/ghostrider-05/patreon-api.ts/issues/3)) ([3ae07bc](https://github.com/ghostrider-05/patreon-api.ts/commit/3ae07bc1663fb1b9d10bd11730cd88a8547aa15b))

## 0.2.0

- `PatreonClient.fetchApplicationToken` is now deprecated and instead `PatreonCreatorClient.fetchApplicationToken` should be used.

### Features

- `PatreonClient`: `name` can be null
- `PatreonClient`: add `refreshOnFailed` option to retry an unauthorized request once
- `PatreonStore`: add Fetch and KV stores
- clients: add `PatreonUserClient` and `PatreonCreatorClient`

## 0.1.0

- Initial commit
