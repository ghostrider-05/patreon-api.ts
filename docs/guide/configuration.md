# Configuration

This page will cover some general topics for configuring this library.

## Client options

### name

To track spam and more, Patreon has made it a requirement to send a `User-Agent` header. This library will send a user agent in the form of:
`{name} (library, version, {rest.userAgentAppendix})`

### oauth

See [the oauth guide](./features/oauth) for configuration of the oauth client.

### store

See [the oauth guide](./features/oauth#store) for configuration of the store for the oauth client.

### rest.emitter

Connect an event emitter to listen to rest events (such as `request`, `response` or `ratelimit`)

<<< @/examples/config/emitter.ts#config{ts twoslash}

### rest.fetch

Overwrite the global fetch function. This can also be overwritten per request.
This will default to the global `fetch` variable on the runtime.

### rest.includeAllQueries

Set the default query to return all relationships and attributes, instead of empty attributes.

:::code-group

<<< @/examples/config/include_all.ts#config{ts twoslash} [Configuration]

<<< @/examples/config/include_all.ts#difference{ts twoslash} [Difference]

:::

The client has a generic boolean to indicate if this option is enabled and correctly changes the response type for all requests.

### rest.retries

Retry a failed request (network lost or 5XX response) a certain amount (defaults to `3`).
You can also change:

- the range of status codes that can be retried
- the backoff strategy for delaying repeated retries

### rest.\{invalidRequestsLimit\}

The API is limiting the amount of invalid requests before rate limiting your client. See the API documentation for the currently documented limit and choose a balanced limit for your client. According to the documentation, they only count `4XX` responses but you can adjust this filter with the `filter` option on the client.

You can also limit all requests with `globalRequestsLimit`.

### rest.\{timeout\}

The following timeout options can be configured:

- `rest.timeout`: the default timeout for a request. Can be overwritten per request.
- `rest.ratelimitTimeout`: the timeout to wait after a request is rate limited.

For more options, such as `api`, `headers` and more, see [the `RestClientOptions` reference](/api/interfaces/RestClientOptions).

## Module augmentation

### Patreon resources

Since the Patreon API documentation is *somewhat* vague for defining resources and issues are open for a few years, you can patch some resources yourself. This library will always follow the documentation, undocumented features will always be opt-in since they are not supported by Patreon.

The patching is supported by using [TypeScript module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) for overriding fields. [Please open an issue](https://github.com/ghostrider-05/patreon-api.ts/issues) if you are using this feature for something that is not covered on this page!

```ts
// ./@types/patreon-api.d.ts
import 'patreon-api.ts'

declare module 'patreon-api.ts' {
    interface CustomTypeOptions {
        social_connections: Record<string, { url: string, user_id: string } | null>
    }
}
```

The following keys can be used in `CustomTypeOptions`:

| Key                  | Resource | Default  | Recommended type                                           |
| -------------------- | -------- | -------- | ---------------------------------------------------------- |
| `social_connections` | `User`   | `object` | `Record<string, { url: string, user_id: string } \| null>` |

An example for the configuration can be found in the [CJS example](https://github.com/ghostrider-05/patreon-api.ts/tree/main/examples/node-cjs/).

### Customization

You can also use module augmentation in this library:

- for creating custom [(typed) response parsers](./features/simplify#custom).
