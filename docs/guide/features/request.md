# Requests

> [!WARNING]
> In API v2, [all attributes must be explicitly requested](https://docs.patreon.com/#apiv2-oauth).

You can use the methods on the client to access the API with an access token.

The examples below demonstrate how to make a fully typed request to the API with different levels of abstraction.

| Feature in client                             | PatreonClient | PatreonOauthClient | RestClient |
| --------------------------------------------- | ------------- | ------------------ | ---------- |
| Rate limit                                    | ✅             | ✅                  | ✅          |
| Edge rate limit                               | ✅             | ✅                  | ✅          |
| Response parsing                              | ✅             | ✅                  | ✅          |
| Request pagination                            | ✅             | ✅                  | ❌          |
| Client token*                                 | ✅             | ✅                  | ❌          |
| [Scope validation](./oauth#scopes-validation) | ✅             | ✅                  | ❌          |
| [Token validation](./oauth#token-validation)  | ✅             | ✅                  | ❌          |
| Query response typed                          | ✅             | ✅                  | ❌          |
| [Response transformation](./simplify)         | ✅             | ❌                  | ❌          |
| Default query**                               | ✅             | ❌                  | ❌          |
| Route methods                                 | ✅             | ❌                  | ❌          |

\* If no token is given in the client options, you can use the [`token` option in the request options](/api/interfaces/Oauth2FetchOptions).

\*\* Default query: using [`transform.includeAllQueries`](../configuration.md#transform-include-allqueries) from the client options allows to fetch the API without providing a query

::: code-group

<<< @/examples/config/client_example.ts#fetch{ts twoslash} [Client example]

<<< @/examples/config/client_example.ts#fetch-raw{ts twoslash} [Oauth client example]

<<< @/examples/config/client_example.ts#fetch-rest{ts twoslash} [Rest client example]

:::

The methods on the client return the default `JSON:API` response. Use the [`simplified` or `normalized` properties](./simplify#methods) to access the simplified methods.

## Query builder

### Include all

> [!TIP] Client option
> To fetch all attributes and relationships on every request, you can use the [`transform.includeAllQueries`](../configuration.md#transform-include-allqueries) client options. This will set the default query on all methods to `<QueryBuilder>.includeAll()`.

By default the Patreon API will return no attributes and relationships and you will have to add the resources needed to your query.
When you want to request all relationships on a query, the `includeAllRelationships` method can be used.
To also request all attributes (including the attributes of the relationships), the `includeAll` method can be used.

> [!TIP] includeAll vs includeAllRelationships
> Both methods on the query builder include all relationships. Only `includeAll` also includes the attributes of the resource and all relationships. Thus there is no need to call both methods on the same query.

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
