# Requests

> [!WARNING]
> In API v2, [all attributes must be explicitly requested](https://docs.patreon.com/#apiv2-oauth).

You can use the methods on the client to access the API.
If no token is given in the client options, you can use the [`token` option in the request options](/api/interfaces/Oauth2FetchOptions).

| Feature in client       | PatreonClient | PatreonOauthClient | RestClient |
| ----------------------- | ------------- | ------------------ | ---------- |
| Rate limit              | ✅             | ✅                  | ✅          |
| Edge rate limit         | ✅             | ✅                  | ✅          |
| Response parsing        | ✅             | ✅                  | ✅          |
| Request pagination      | ✅             | ✅                  | ❌          |
| Client token            | ✅             | ✅                  | ❌          |
| Scope validation        | ✅             | ✅                  | ❌          |
| Token validation        | ✅             | ✅                  | ❌          |
| Query response typed    | ✅             | ✅                  | ❌          |
| Response transformation | ✅             | ❌                  | ❌          |
| Default query           | ✅             | ❌                  | ❌          |
| Route methods           | ✅             | ❌                  | ❌          |

::: code-group

<<< @/examples/config/client_example.ts#fetch{ts twoslash} [Client example]

<<< @/examples/config/client_example.ts#fetch-raw{ts twoslash} [Oauth client example]

<<< @/examples/config/client_example.ts#fetch-rest{ts twoslash} [Rest client example]

:::

The methods on the client return the default `JSON:API` response. Use the [`simplified` or `normalized` properties](./simplify#methods) to access the simplified methods.

## Query builder

### Include all

> [!INFO] Client option
> To fetch all attributes and relationships on every request, you can use the [`rest.includeAllQueries`](../configuration.md#rest-include-allqueries) client options.

By default the Patreon API will return no attributes and relationships and you will have to add the resources needed to your query.
When you want to request all relationships on a query, the `includeAllRelationships` method can be used.
To also request all attributes (including the attributes of the relationships), the `includeAll` method can be used.

### Pagination

The Patreon API has implemented [pagination using cursors](https://docs.patreon.com/#pagination). You can set the page size and cursor in the request options using [the `setRequestOptions` method on the query builder](/api/classes/QueryBuilder#setrequestoptions).

To paginate the API without manually setting the cursors, you can use the `paginate*` client methods. These methods return an [`AsyncGenerator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator) to iterate over the pages.

## Routes

### Fetch a campaign

<<< @/examples/oauth/routes.ts#campaign{ts twoslash}

### Fetch campaigns

:::code-group

<<< @/examples/oauth/routes.ts#campaigns{ts twoslash} [Fetch]

<<< @/examples/oauth/routes.ts#campaigns-paginate{ts twoslash} [Paginate]

:::

### Fetch members

:::code-group

<<< @/examples/oauth/routes.ts#members{ts twoslash} [Fetch]

<<< @/examples/oauth/routes.ts#members-paginate{ts twoslash} [Paginate]

:::
