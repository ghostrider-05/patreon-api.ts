# Oauth

The Patreon API is only accessible by authorizing your request with an access token:

- [Creator token](#creator-token): the tokens you can find in the developer portal. Use this if you are only using the API for your own account
- [User Oauth](#user-oauth2): user can login to Patreon and be redirect to your application. Use this to grant access to users to a Patreon only part of your application.

## Creator token

If you don't need to handle Oauth2 requests, but only your own creator profile, the first example will get you started.
It is recommended to [sync your token](#store) to your database or store it somewhere safe, so the token is not lost.

<<< @/examples.ts#client-creator

## User oauth2

For handling Oauth2 requests, add `redirectUri` and if specified a `state` to the options.
Determine the `scopes` you will need, request only the scopes that your application requires.
Then fetch the token for the user with request url.
Note that for handling Oauth2 requests the client will not cache or store the tokens anywhere in case you need to refresh it!

<<< @/examples.ts#client-user

## Routes

::: info

This section is included from GitHub: [`/examples/README.md`](https://github.com/ghostrider-05/patreon-api.ts/tree/main/examples/README.md).

:::

<!--@include: ../../../examples/README.md{4,}-->

## Store

There are 3 built-in methods of retreiving and storing tokens:

1. Manual loading and storing
2. Fetch: use an external server that accepts `GET` and `PUT` requests
3. KV: store the (creator) token in a KV-like storage system (present on a lot of edge-runtimes).


::: code-group

<<< @/examples.ts#store-kv [KV store]

<<< @/examples.ts#store-custom [manual loading]

:::
