# Features

## Authorization

The patreon API is only accessible by using Oauth. You can choose between two types of applications:

- [Creator account](./oauth#creator-token)
- [User Oauth](./oauth#user-oauth2)

For both types of applications you will need to [create a client in the developer portal](https://www.patreon.com/portal/registration/register-clients). Copy the client id and secret and store them in your secrets. You can also find the creator access and refresh tokens in the client information.

## Request

When you have created the application, you're ready to make a request.

> [!NOTE]
> In API v2, [all attributes must be explicitly requested](https://docs.patreon.com/#apiv2-oauth).

You can use the methods on the client:

::: code-group

<<< @/examples/config/client_example.ts#fetch{ts twoslash} [Client example]

<<< @/examples/config/client_example.ts#fetch-raw{ts twoslash} [Raw example]

:::

> [!NOTE] Tip
> My advice is to write your own wrapper / class that uses a client with all attributes and included resources configured.
> If you need all the relationships and attributes, you can also use the client option `includeAllQueries` (see example above).

:::code-group

<<< @/examples/oauth/client.ts#wrapper{ts twoslash} [Custom wrapper]

<<< @/examples/oauth/client.ts#custom{ts twoslash} [Custom client]

:::

## Responses

When fetching a resource the response is a JSON:API response and is typed based on the query, see [the introduction](../introduction).

You can also [normalize](./simplify) responses to connect the relationships and included items.

## Testing

Not ready to connect your Patreon account to your application? Test your app with [the sandbox](./sandbox) with sample payloads.
