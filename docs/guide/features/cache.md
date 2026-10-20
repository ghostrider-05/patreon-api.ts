# Cache

## Stores

### Resources

When storing API resources, the `CacheStore` can be used.


### Tokens

### Custom

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

<<< @/examples/config/cache.ts#file-cache-all{ts twoslash} [With bulk methods]

:::
