# Testing & sandbox

Since the Patreon API is readonly, you can mock responses to test if your application works.

## Testing & Mocking

### Random vs cache

All methods that return mocked data implement the following flow:

- by default: if an item is found in the cache, it returns that item. Otherwise it will create a random item of the same resource
- with `options.cache` equal to `false`: returns a random item of the resource
- with `options.random` equal to `false`: if an item is found in the cache, it returns that item. Otherwise returns an empty string.
- with `options.random` equal to `false` and `options.cache` equal to `false`: returns an empty string

### Validation

You can also enable validation to ensure your mocked requests are valid. If validation fails, it will throw an error (does not change the response). The following items can be validated:

- request path (always validated): whether the url of the request is a valid API url
- `headers`: specify the headers (and values) that must be present on the request
- `query`: whether the query of the url will be validated, such that every relationship is valid for the url and each attribute exists

<<< @/examples/mock/validation.ts{ts twoslash}

### Random data

You can create a random:

- id: `PatreonMockData.createId(type: Type)`
- resource: `PatreonMockData.random[Type](id: string)`

:::warning External library

The random data generator in this library is quite simple at the moment, so I suggest to use a random generator library like `faker-js`.

Also note that each value is generated independent from other attributes.

:::

With an id and (partial) resource, you can create an API response.
The response attributes (and relationships) will be reflected from the query.

<<< @/examples/mock/random.ts#resource{ts twoslash}

To add relationships to the response, define the included items:

<<< @/examples/mock/random.ts#resource-relationships{ts twoslash}

### Cache

The cache for mocking requests holds all attributes and relationships to act as a consistent server.

:::info Relationships

The cache will only require an id for relationships and rebuild a response using the relation map for that resource.
When a resource is not in the cache, the `onMissingRelationship` option will decide what action is taken: throw an error, log a warning or nothing (default).

:::

To define items in the cache, use the `intitial` option:

<<< @/examples/mock/cache.ts{ts twoslash}

#### Write requests

For `POST`, `PATCH` and `DELETE` the cache will update the cache using `setRequestBody`, .e.g delete an item (will not delete or change relationships), update attributes or add a new item. This is done by the exposed handlers or callbacks and the only supported resource is `'webhook'`.

## Frameworks

### OpenAPI

See [the API reference](https://patreon.apidocumentation.com/v2-stable/reference) for an OpenAPI schema for the Patreon V2 API.
This is an unofficial schema and based on the official documentation, made with this library.

### MockAgent

To intercept a request to the Patreon API you can use undici's [`MockAgent` API](https://undici.nodejs.org/#/docs/api/MockAgent) to mock API responses.

:::code-group

<<< @/examples/mock/agent.ts#mock-agent{ts twoslash} [Cache or random data]

<<< @/examples/mock/agent.ts#mock-agent-response{ts twoslash} [Custom response]

:::

### MSW

You can also intercept requests by using request handlers for some or all routes. A popular API using handlers is [Mock Service Worker](https://mswjs.io/docs/getting-started).

:::info `transformResponse`

By default a handler will return an object with a status, body and headers. You can use this option to transform this object into a `Response` or something else for every handler.

:::

:::code-group

<<< @/examples/mock/msw.ts#handler{ts twoslash} [Route handler]

<<< @/examples/mock/msw.ts#all-handlers{ts twoslash} [All routes]

<<< @/examples/mock/msw.ts#error-handler{ts twoslash} [Error handler]

:::

### Other

Is there another popular testing / mocking framework that uses a completely different API? Open an issue on GitHub to add new mocking functionality and/or guides.

## Webhooks

You can use webhook mocking to test your implementation of your server. You can create a request with `createRequest` or send it with `send` to an external server.

### Retries

The `retries` option (this uses the same implementation as [client `rest.retries`](../configuration#restretries) option) allows you to implement the same [retry system Patreon has](https://docs.patreon.com/#robust-retries).

The `send` method has a return type of `Promise<number | null>`. If the type is a `number`, the server has returned a succesful response. Otherwise (with `retries` enabled), it will return `null` and add / update the message to the `queuedMessages`. With no retry options, it will return the status of the failed request. When a message is retried succesfully:

- the message will be deleted from the queue
- all other messages from the same webhook will be retried immediately

The `sendQueuedMessage` / `sendQueuedMessages` methods will trigger a retry manually for one / all queued messages.

When a webhook is stored in the [mock cache](#cache), the `paused`, `last_attempted_at` and `num_consecutive_times_failed` attributes will be updated to reflect the queue of the webhook.
