# Requests

> [!WARNING]
> In API v2, [all attributes must be explicitly requested](https://docs.patreon.com/#apiv2-oauth).

You can use the methods on the client to access the API.
If no token is given in the client options, you can use the [`token` option in the request options](/api/interfaces/Oauth2FetchOptions).

::: code-group

<<< @/examples/config/client_example.ts#fetch{ts twoslash} [Client example]

<<< @/examples/config/client_example.ts#fetch-raw{ts twoslash} [Raw example]

:::

The methods on the client return the default `JSON:API` response. Use the [`simplified` or `normalized` properties](./simplify#methods) to access the simplified methods.

## Query builder

> [!INFO] Include all
> To fetch all attributes and relationships on every request, you can use the [`rest.includeAllQueries`](../configuration.md#rest-include-allqueries) client options.

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
