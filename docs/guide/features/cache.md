# Cache

## Stores

### Resources

When storing API resources, the `CacheStore` can be used.
This cache has methods for:

- synchronizing the cache with external resources, `syncResource` or `syncRequest` for parsing the resource out of the incoming request.
- parsing resources and relationships to the JSON:API format.

### Tokens

When [storing API tokens](./oauth#cache), the `CacheTokenStore` can be used.
This store extends the [base for the custom store](#custom).

:::details Example

<<< @/examples/config/cache.ts#store-tokens{ts twoslash}

:::

### Custom

<<< @/examples/config/cache.ts#store-custom{ts twoslash}

## Bindings

When no binding is configured, the cache store will use the process memory for the items.
To persist the data outside of the process, a binding is needed.

A binding is a standard interface to allow any storage to use in all caches in this library.
Each binding defines handlers for `get`, `put`, `delete` methods. Optionally, bulk and search methods can also be defined for the binding.

> [!TIP]
> At the moment, no bindings are "official" and included in this library.
> Some bindings are listed below as an example. Open an issue if you are using this feature and want to have this included.

### File

::: code-group

<<< @/examples/config/cache.ts#file-cache{ts twoslash} [Basic methods]

<<< @/examples/config/cache.ts#file-cache-sync{ts twoslash} [Basic sync methods]

<<< @/examples/config/cache.ts#file-cache-all{ts twoslash} [With bulk methods]

:::
