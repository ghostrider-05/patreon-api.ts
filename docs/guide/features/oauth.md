# Oauth

The Patreon API is only accessible by authorizing your request with an access token:

- [Creator token](#creator-token): the tokens you can find in the developer portal. Use this if you are only using the API for your own account
- [User Oauth](#user-oauth2): user can login to Patreon and be redirect to your application. Use this to grant access to users to a Patreon only part of your application.

## Creator token

If you don't need to handle Oauth2 requests, but only your own creator profile, the first example will get you started.

:::warning Expiring tokens

It is recommended to [sync your token](#store) to your database or store it somewhere safe, so the token is not lost.
[Creator tokens will expire](https://www.patreondevelopers.com/t/non-expiring-creators-access-token/213/25) after a certain time (likely a few days to a month), so you will need to [refresh the token](#refresh-tokens) regularly.

Note: There have been reports that [tokens expire when the creator logs in](https://www.patreondevelopers.com/t/creators-access-token-refreshes-everytime-creator-logs-in/6917/6).

:::

:::code-group

<<< @/examples/oauth/creator.ts#token-options{ts twoslash} [Token in options]

<<< @/examples/oauth/creator.ts#token-store{ts twoslash} [Token store]

:::

## User oauth2

For handling Oauth2 requests, add a `redirectUri` and if specified a `state` to the options.
Determine the `scopes` you will need and request only the scopes that your application requires.

### Callback

When a user logins on the Patreon website, they will be redirect to the `redirectUri` of your client. With the `code` query you can fetch the token for the user with the request url.

:::warning

Note that for handling Oauth2 requests the client will not cache or store the tokens anywhere in case you need to refresh it!

:::

:::code-group

<<< @/examples/oauth/user.ts#instance{ts twoslash} [With instance]

<<< @/examples/oauth/user.ts#code{ts twoslash} [With code]

:::

### Redirect

Since the client has already configured a redirect uri, scopes and client information, you can also handle Oauth2 login requests:

:::code-group

<<< @/examples/oauth/user.ts#login-client{ts twoslash} [Client options]

<<< @/examples/oauth/user.ts#login-custom{ts twoslash} [Method options]

:::

## Refresh tokens

To refresh an access token you can use the `refreshToken` method on the oauth client.
The cached token will be updated to the refreshed token.

:::info Store

If you have configured [a token store](#store) on the client, calling the `refreshToken` method will also call the `put` method on the store with the refreshed token.

:::

<<< @/examples/oauth/refresh_token.ts#cache-token{ts twoslash}


## Revoke tokens

It is not possible to revoke a token with the documented API.

## Routes

::: info

This section is included from GitHub: [`/examples/README.md`](https://github.com/ghostrider-05/patreon-api.ts/tree/main/examples/README.md).

:::

<!--@include: ../../../examples/README.md{4,}-->

## Validation

Validations are disabled by default and require the compared values (such as scopes or token) to be provided in the options of the client.

### Scopes validation

If you are using a user client you can enable scope validation:

- to throw an error on missing scopes
- to log a warning on missing scopes

Before a request is made, the scopes for the url and query will be checked:

- the main resource of a route
- protected relationships / attributes (think of address or email)

See the Patreon documentation for the required scopes.

### Token validation

With token validation you can let the client refresh tokens when:

- a token with an `expires_in_epoch` attribute is expired
- a token with no expiry returns an unauthorized response

After refreshing, the token will be stored in `client.oauth.cachedToken` and updated in the store, if connected.

If no token is provided in the request options, the validation will throw an error.

## Store

There are 3 built-in methods of retrieving and storing tokens:

1. Manual loading and storing
2. Fetch: use an external server that accepts `GET` and `PUT` requests
3. KV: store the (creator) token in a KV-like storage system (present on a lot of edge-runtimes).

:::code-group

<<< @/examples/oauth/store.ts#kv-store{ts twoslash} [KV store]

<<< @/examples/oauth/store.ts#fetch-store{ts twoslash} [Fetch store]

<<< @/examples/oauth/store.ts#custom-store{ts twoslash} [Custom store]

:::

