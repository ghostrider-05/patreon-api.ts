# Changelog

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
