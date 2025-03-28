# Normalized responses

The Patreon API returns data in the [JSON:API](https://jsonapi.org/) format with the data spread over `attributes`, `relationships` and `included` fields. Using a normalized / simplified response will combine all `relationships` with `included` data.

Since this format is not the easiest to work, I'd advice to use the normalize, simplified or [your own](#custom) response parsers. Compare the payloads below.

:::code-group

<<< @/examples/simplify/json_api_payload.json [JSON:API (default)]

<<< @/examples/simplify/normalized_payload.json [Normalized]

<<< @/examples/simplify/simplified_payload.json [Simplified]

:::


## simplified

The `simplify` method will both `normalize` the response and convert all keys to camelCase.

<<< @/examples.ts#transform-simplify

## custom

You can also create a custom payload parser to append certain attributes or modify the request in a different way.

To register a custom parser, use [module augmentation](../configuration#module-augmentation) for the correct types.
Add a key to `ResponseTransformMap` with a function that satisfies `(res: GetResponsePayload<Query>) => any`.

> [!WARNING]
> Since I don't know how (or it is not possible) to do module augmentation with generics, `response` will be typed as `never`.
> When you create your custom parser, you will be able to see the correct types for `response`.

An example for adding a `campaign_id` to every response:

<<< @/examples/simplify/parser.d.ts{ts}
