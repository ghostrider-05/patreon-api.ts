# Changelog

## [0.14.2](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.14.1...patreon-api.ts-v0.14.2) (2025-05-30)


### Bug Fixes

* **oauth:** properly set cursor on pagination ([babb9a9](https://github.com/ghostrider-05/patreon-api.ts/commit/babb9a970431e164974d6c03d7470d1c3a361092))

## [0.14.1](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.14.0...patreon-api.ts-v0.14.1) (2025-05-29)


### Bug Fixes

* **oauth:** space-separated `scope` param in authorize URL ([#177](https://github.com/ghostrider-05/patreon-api.ts/issues/177)) ([ce6401c](https://github.com/ghostrider-05/patreon-api.ts/commit/ce6401c0036d60dd1bc59ee09f666a9abb73063f))
* **oauth:** stop paginating on last page ([#181](https://github.com/ghostrider-05/patreon-api.ts/issues/181)) ([cbe9a0b](https://github.com/ghostrider-05/patreon-api.ts/commit/cbe9a0bdaf783be2ab9f398bdb2bcddc1b34bb79))

## [0.14.0](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.13.0...patreon-api.ts-v0.14.0) (2025-05-18)


### ⚠ BREAKING CHANGES

* **rest:** remove deprecated PATREON_RESPONSE_HEADERS
* **webhooks:** remove getWebhookUserId method
* **webhooks:** remove webhook to discord method ([#173](https://github.com/ghostrider-05/patreon-api.ts/issues/173))

### Features

* **createQuery:** deprecate in favor of QueryBuilder.fromParams ([c8a256b](https://github.com/ghostrider-05/patreon-api.ts/commit/c8a256bc17fb7d48bcc3ff6d5f84dfddb28b8f12))
* **QueryBuilder:** add resourceAttributes property ([1743946](https://github.com/ghostrider-05/patreon-api.ts/commit/174394616cf69d970aea331e750784956502a74b))
* **QueryBuilder:** expose schema properties and relations of resource ([1743946](https://github.com/ghostrider-05/patreon-api.ts/commit/174394616cf69d970aea331e750784956502a74b))
* **rest:** remove deprecated PATREON_RESPONSE_HEADERS ([5793cd0](https://github.com/ghostrider-05/patreon-api.ts/commit/5793cd0f7566199a66996bd5011b096b915f768b))
* **WebhookPayloadClient:** add convert method ([8828cb2](https://github.com/ghostrider-05/patreon-api.ts/commit/8828cb2802bb820eae86d98c1e621a09ad0b161e))
* **webhooks:** remove getWebhookUserId method ([ffedd84](https://github.com/ghostrider-05/patreon-api.ts/commit/ffedd84147d147e8af3ba53bbe554e14de91277d))
* **webhooks:** remove webhook to discord method ([#173](https://github.com/ghostrider-05/patreon-api.ts/issues/173)) ([ffedd84](https://github.com/ghostrider-05/patreon-api.ts/commit/ffedd84147d147e8af3ba53bbe554e14de91277d))


### Bug Fixes

* **QueryBuilder:** filter duplicate relationships ([1743946](https://github.com/ghostrider-05/patreon-api.ts/commit/174394616cf69d970aea331e750784956502a74b))
* **rest:** only warn/throw when scopes are missing ([#176](https://github.com/ghostrider-05/patreon-api.ts/issues/176)) ([e7a717c](https://github.com/ghostrider-05/patreon-api.ts/commit/e7a717cbed6f7ac4dd004a4366154b7208a3991c))

## [0.13.0](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.12.3...patreon-api.ts-v0.13.0) (2025-04-26)


### ⚠ BREAKING CHANGES

* remove deprecated SchemaRelationshipKeys and SchemaKeys ([#160](https://github.com/ghostrider-05/patreon-api.ts/issues/160))
* **types:** remove deprecated schema and rest types ([#159](https://github.com/ghostrider-05/patreon-api.ts/issues/159))

### Features

* **docs:** add library export reference ([8d38e02](https://github.com/ghostrider-05/patreon-api.ts/commit/8d38e02a876366331f84dcfb1d601b963fb17754))
* remove deprecated SchemaRelationshipKeys and SchemaKeys ([#160](https://github.com/ghostrider-05/patreon-api.ts/issues/160)) ([3f21584](https://github.com/ghostrider-05/patreon-api.ts/commit/3f21584eacca54ce8ed99f97578f137002591825))
* **types:** remove deprecated schema and rest types ([#159](https://github.com/ghostrider-05/patreon-api.ts/issues/159)) ([a670ca5](https://github.com/ghostrider-05/patreon-api.ts/commit/a670ca521960cd849771ceb203158c0dae8584a7))


### Bug Fixes

* **rest:** convert `retry_after_seconds` from body ([f5feef2](https://github.com/ghostrider-05/patreon-api.ts/commit/f5feef27f289c3de275aecac7cd446f0a1dec04b))
* **rest:** correct default url comment for api option ([a395deb](https://github.com/ghostrider-05/patreon-api.ts/commit/a395debe5c52c3cff9cd5a52153d6a36598ed6d0))

## [0.12.3](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.12.2...patreon-api.ts-v0.12.3) (2025-04-18)


### Bug Fixes

* **rest:** check error body for retry_after_seconds if not in headers ([ce400ac](https://github.com/ghostrider-05/patreon-api.ts/commit/ce400ac00be2150188deb2502cbead6ad7d95c69))
* **rest:** remove second check for retries in ratelimited response ([ce400ac](https://github.com/ghostrider-05/patreon-api.ts/commit/ce400ac00be2150188deb2502cbead6ad7d95c69))
* **rest:** throw invalid error response body ([#156](https://github.com/ghostrider-05/patreon-api.ts/issues/156)) ([ce400ac](https://github.com/ghostrider-05/patreon-api.ts/commit/ce400ac00be2150188deb2502cbead6ad7d95c69))
* **rest:** throw response body if it is not JSON ([ce400ac](https://github.com/ghostrider-05/patreon-api.ts/commit/ce400ac00be2150188deb2502cbead6ad7d95c69))

## [0.12.2](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.12.1...patreon-api.ts-v0.12.2) (2025-04-15)


### Bug Fixes

* **openapi:** remove deprecated imports ([5db3277](https://github.com/ghostrider-05/patreon-api.ts/commit/5db3277dbc4cf56ddab6acf4d279155f0d04f4ac))
* **QueryBuilder:** allow adding any relationship with attributes ([5db3277](https://github.com/ghostrider-05/patreon-api.ts/commit/5db3277dbc4cf56ddab6acf4d279155f0d04f4ac))
* **QueryBuilder:** flatten attributes in `addRelationshipAttributes` method ([5db3277](https://github.com/ghostrider-05/patreon-api.ts/commit/5db3277dbc4cf56ddab6acf4d279155f0d04f4ac))
* **QueryBuilder:** improve types for `attributesFor` method and convert relation ([5db3277](https://github.com/ghostrider-05/patreon-api.ts/commit/5db3277dbc4cf56ddab6acf4d279155f0d04f4ac))
* **QueryBuilder:** improve types for added relationship attributes ([#153](https://github.com/ghostrider-05/patreon-api.ts/issues/153)) ([5db3277](https://github.com/ghostrider-05/patreon-api.ts/commit/5db3277dbc4cf56ddab6acf4d279155f0d04f4ac))
* **QueryBuilder:** use relation type for `setRelationshipAttributes` method ([5db3277](https://github.com/ghostrider-05/patreon-api.ts/commit/5db3277dbc4cf56ddab6acf4d279155f0d04f4ac))

## [0.12.1](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.12.0...patreon-api.ts-v0.12.1) (2025-04-02)


### Bug Fixes

* **normalize:** use relation name instead of type ([05ce587](https://github.com/ghostrider-05/patreon-api.ts/commit/05ce58711f0be233fb00cc6fbf682436ce39e61f))
* **QueryBuilder:** convert correctly type to relation name ([3c853b6](https://github.com/ghostrider-05/patreon-api.ts/commit/3c853b6e872d41e8d2bccfbda7882a9bee002cef))
* **simplify:** do not truncate longer words ([738996b](https://github.com/ghostrider-05/patreon-api.ts/commit/738996be2adf908b80bec8692e3452d952a9c35b))

## [0.12.0](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.11.0...patreon-api.ts-v0.12.0) (2025-03-28)


### ⚠ BREAKING CHANGES

* **oauth:** disable token validation by default
* **rest:** remove statusText from response event

### Features

* allow pledge type in mock resource id ([d5b7063](https://github.com/ghostrider-05/patreon-api.ts/commit/d5b7063f81d036fbba6fe364d8ef3eb8917018b5))
* **docs:** improve guides and code examples ([#147](https://github.com/ghostrider-05/patreon-api.ts/issues/147)) ([1876505](https://github.com/ghostrider-05/patreon-api.ts/commit/18765058b248c7ce50c10bfe2a55b824929ad095))
* **oauth:** disable token validation by default ([1876505](https://github.com/ghostrider-05/patreon-api.ts/commit/18765058b248c7ce50c10bfe2a55b824929ad095))
* **rest:** allow header object in error ([d4741f6](https://github.com/ghostrider-05/patreon-api.ts/commit/d4741f6fc59c6edfcc81b7bb75204f1570a31b3b))
* **rest:** deprecate getAccessToken option ([1876505](https://github.com/ghostrider-05/patreon-api.ts/commit/18765058b248c7ce50c10bfe2a55b824929ad095))
* **rest:** remove statusText from response event ([d4741f6](https://github.com/ghostrider-05/patreon-api.ts/commit/d4741f6fc59c6edfcc81b7bb75204f1570a31b3b))
* **webhooks:** allow parse request with only text method ([b6a334a](https://github.com/ghostrider-05/patreon-api.ts/commit/b6a334ac9fd233a11bc662f96e9a11518df3213b))
* **webhooks:** remove undefined from client methods ([42f081c](https://github.com/ghostrider-05/patreon-api.ts/commit/42f081cbcb556552e166ea61b0a7a4f23d3d7b5e))


### Bug Fixes

* **build:** exclude changelog from package ([9946a13](https://github.com/ghostrider-05/patreon-api.ts/commit/9946a13ca1f6c9088edcfe20631cf7db965e50e6))
* correctly handle null relationships (close [#144](https://github.com/ghostrider-05/patreon-api.ts/issues/144)) ([#146](https://github.com/ghostrider-05/patreon-api.ts/issues/146)) ([437f336](https://github.com/ghostrider-05/patreon-api.ts/commit/437f33627fc499058475b61461eddb158131911a))
* **oauth:** only refresh token with refresh token on validation ([1876505](https://github.com/ghostrider-05/patreon-api.ts/commit/18765058b248c7ce50c10bfe2a55b824929ad095))

## [0.11.0](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.10.0...patreon-api.ts-v0.11.0) (2025-03-07)


### Features

* add support for testing and mocking (sandbox) ([#137](https://github.com/ghostrider-05/patreon-api.ts/issues/137)) ([5aba4f7](https://github.com/ghostrider-05/patreon-api.ts/commit/5aba4f75c4954a3123e56e01c6a38faa29fd4d61))
* add types and methods to convert between relation name and resource type ([5aba4f7](https://github.com/ghostrider-05/patreon-api.ts/commit/5aba4f75c4954a3123e56e01c6a38faa29fd4d61))
* add types for write requests (body and response) ([5aba4f7](https://github.com/ghostrider-05/patreon-api.ts/commit/5aba4f75c4954a3123e56e01c6a38faa29fd4d61))
* **rest:** add backoff to retries ([#135](https://github.com/ghostrider-05/patreon-api.ts/issues/135)) ([38b6731](https://github.com/ghostrider-05/patreon-api.ts/commit/38b67312f32737e50e14ae47c743cf8790b69e0d))
* **rest:** include client name in User-Agent header ([5aba4f7](https://github.com/ghostrider-05/patreon-api.ts/commit/5aba4f75c4954a3123e56e01c6a38faa29fd4d61))
* **store:** add delete and list options ([5aba4f7](https://github.com/ghostrider-05/patreon-api.ts/commit/5aba4f75c4954a3123e56e01c6a38faa29fd4d61))
* **store:** add Map / memory token store ([5aba4f7](https://github.com/ghostrider-05/patreon-api.ts/commit/5aba4f75c4954a3123e56e01c6a38faa29fd4d61))


### Bug Fixes

* **client:** use default token without validation ([c0680c6](https://github.com/ghostrider-05/patreon-api.ts/commit/c0680c6fb92b92fca4fff277c35becef29ee5fe0))
* **openapi:** return 204 response for delete webhook endpoint ([5aba4f7](https://github.com/ghostrider-05/patreon-api.ts/commit/5aba4f75c4954a3123e56e01c6a38faa29fd4d61))

## [0.10.0](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.9.0...patreon-api.ts-v0.10.0) (2025-02-06)


### ⚠ BREAKING CHANGES

* Patreon (member) resource updates ([#120](https://github.com/ghostrider-05/patreon-api.ts/issues/120))

### Features

* add better query builder ([#122](https://github.com/ghostrider-05/patreon-api.ts/issues/122)) ([b64a95e](https://github.com/ghostrider-05/patreon-api.ts/commit/b64a95e9252f97d76fc00628eb7d45f96635f0bf))
* add client option for including all in query ([#133](https://github.com/ghostrider-05/patreon-api.ts/issues/133)) ([1b19772](https://github.com/ghostrider-05/patreon-api.ts/commit/1b19772d601e5e9acb5ebe7cf5c9c020cf513ac5))
* add DELETE /webhooks/{id} endpoint ([#102](https://github.com/ghostrider-05/patreon-api.ts/issues/102)) ([10fc710](https://github.com/ghostrider-05/patreon-api.ts/commit/10fc710e0b231fb60cdaa9b1cf9a793a7e6c2be4))
* mark normalize and simplify APIs as stable ([#134](https://github.com/ghostrider-05/patreon-api.ts/issues/134)) ([dea5a6e](https://github.com/ghostrider-05/patreon-api.ts/commit/dea5a6e5348915722d9f553fe67d4be6fb2b7cdb))
* Patreon (member) resource updates ([#120](https://github.com/ghostrider-05/patreon-api.ts/issues/120)) ([71752d9](https://github.com/ghostrider-05/patreon-api.ts/commit/71752d9f0258030dafef9b8a23561f4206d4e8dc))
* **rest:** respect Retry-After header on ratelimit ([#119](https://github.com/ghostrider-05/patreon-api.ts/issues/119)) ([0d33950](https://github.com/ghostrider-05/patreon-api.ts/commit/0d33950dc43673a1c3fb8842bff49f8ed19b3081))


### Bug Fixes

* add related links to relationships ([#121](https://github.com/ghostrider-05/patreon-api.ts/issues/121)) ([1c40269](https://github.com/ghostrider-05/patreon-api.ts/commit/1c402690f7acd67caa84de443c20df98edf3ecbd))
* **docs:** update broken code examples ([1b19772](https://github.com/ghostrider-05/patreon-api.ts/commit/1b19772d601e5e9acb5ebe7cf5c9c020cf513ac5))
* **types:** return correct requests for normalize and simplify methods ([1b19772](https://github.com/ghostrider-05/patreon-api.ts/commit/1b19772d601e5e9acb5ebe7cf5c9c020cf513ac5))
* update normalize and simplify methods to not crash ([1b19772](https://github.com/ghostrider-05/patreon-api.ts/commit/1b19772d601e5e9acb5ebe7cf5c9c020cf513ac5))

## [0.9.0](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.8.0...patreon-api.ts-v0.9.0) (2024-11-02)


### Features

* add OpenAPI schema ([#100](https://github.com/ghostrider-05/patreon-api.ts/issues/100)) ([bb335e7](https://github.com/ghostrider-05/patreon-api.ts/commit/bb335e7b4309a5de7ad50ddfe3a27ae96e5d71f5))
* **rest:** add Cloudflare ray id and cache status to headers ([5a5cb50](https://github.com/ghostrider-05/patreon-api.ts/commit/5a5cb50255eb7dda78f50933a21873a07a2ecda0))
* **rest:** add event emitter option ([5a5cb50](https://github.com/ghostrider-05/patreon-api.ts/commit/5a5cb50255eb7dda78f50933a21873a07a2ecda0))
* **rest:** add ratelimit sleep option ([5a5cb50](https://github.com/ghostrider-05/patreon-api.ts/commit/5a5cb50255eb7dda78f50933a21873a07a2ecda0))
* **rest:** add request limit option ([#99](https://github.com/ghostrider-05/patreon-api.ts/issues/99)) ([5a5cb50](https://github.com/ghostrider-05/patreon-api.ts/commit/5a5cb50255eb7dda78f50933a21873a07a2ecda0))
* **rest:** deprecate certain types ([#107](https://github.com/ghostrider-05/patreon-api.ts/issues/107)) ([ddf065f](https://github.com/ghostrider-05/patreon-api.ts/commit/ddf065f7fbab68ea1ead5ecb804b19cc2b5389e9))
* **webhooks:** add support for http server verifying ([#101](https://github.com/ghostrider-05/patreon-api.ts/issues/101)) ([ccc2267](https://github.com/ghostrider-05/patreon-api.ts/commit/ccc226789b0996a223b324e3861c061588190953))


### Bug Fixes

* **build:** add missing type-checking rules ([ac17495](https://github.com/ghostrider-05/patreon-api.ts/commit/ac1749554c2f5998ef5271c40d8405237d536821))
* **examples:** update embed converter ([34e62f0](https://github.com/ghostrider-05/patreon-api.ts/commit/34e62f04f33d1dae5d667dfe9ec7df0529436e98))
* **rest:** retry ratelimited requests ([5a5cb50](https://github.com/ghostrider-05/patreon-api.ts/commit/5a5cb50255eb7dda78f50933a21873a07a2ecda0))
* **rest:** throw all errors from response ([aaf9847](https://github.com/ghostrider-05/patreon-api.ts/commit/aaf98470e778b3f06da67b7c818159439a0431b4))
* **rest:** update typo in unknown error code ([5a5cb50](https://github.com/ghostrider-05/patreon-api.ts/commit/5a5cb50255eb7dda78f50933a21873a07a2ecda0))

## [0.8.0](https://github.com/ghostrider-05/patreon-api.ts/compare/patreon-api.ts-v0.7.0...patreon-api.ts-v0.8.0) (2024-10-04)


### ⚠ BREAKING CHANGES

* **PatreonOauthClient:** remove static fetch and paginate methods

### Features

* allow overriding `User.social_connections` through module augmentation ([dd32c10](https://github.com/ghostrider-05/patreon-api.ts/commit/dd32c1012d72bb2b8234740286f2cf87dbde2e33))
* **apps:** add example discord bot ([#90](https://github.com/ghostrider-05/patreon-api.ts/issues/90)) ([86988a4](https://github.com/ghostrider-05/patreon-api.ts/commit/86988a4391a34e429fe3fe735d24ee147e930fd6))
* deprecate webhook to Discord embed utilities ([86988a4](https://github.com/ghostrider-05/patreon-api.ts/commit/86988a4391a34e429fe3fe735d24ee147e930fd6))
* **PatreonClient:** add method for custom response parser ([#97](https://github.com/ghostrider-05/patreon-api.ts/issues/97)) ([17e87fc](https://github.com/ghostrider-05/patreon-api.ts/commit/17e87fc5b5fa8bb6f69731bfd7c5d9abe4c919f5))
* **PatreonOauthClient:** remove static fetch and paginate methods ([86988a4](https://github.com/ghostrider-05/patreon-api.ts/commit/86988a4391a34e429fe3fe735d24ee147e930fd6))
* **types:** add member and post webhook payload types ([dd32c10](https://github.com/ghostrider-05/patreon-api.ts/commit/dd32c1012d72bb2b8234740286f2cf87dbde2e33))
* **WebhookClient:** add payloads property for webhook payload utilities ([86988a4](https://github.com/ghostrider-05/patreon-api.ts/commit/86988a4391a34e429fe3fe735d24ee147e930fd6))


### Bug Fixes

* **examples:** update wrangler compat dates ([86988a4](https://github.com/ghostrider-05/patreon-api.ts/commit/86988a4391a34e429fe3fe735d24ee147e930fd6))
* update code example ([#81](https://github.com/ghostrider-05/patreon-api.ts/issues/81)) ([5cba8ab](https://github.com/ghostrider-05/patreon-api.ts/commit/5cba8ab265526e96053bcd4e6db07fddcb8628e7))
* **webhooks:** set pledge resource type to member ([#91](https://github.com/ghostrider-05/patreon-api.ts/issues/91)) ([dd32c10](https://github.com/ghostrider-05/patreon-api.ts/commit/dd32c1012d72bb2b8234740286f2cf87dbde2e33))

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
