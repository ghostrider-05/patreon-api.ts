# Configuration

This page will cover some general topics for configuring this library, see the [features overview](./features/) for how to configure the clients and methods.

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

Examples for all keys can be found in the [CMS example](https://github.com/ghostrider-05/patreon-api.ts/tree/main/examples/node-cjs/).

### Customization

You can also use module augmentation in this library:

- for creating custom [(typed) response parsers](./features/simplify#custom).
