# Normalized responses

The Patreon API returns data in the [JSON:API](https://jsonapi.org/) format with the data spread over `attributes`, `relationships` and `included` fields.

Since this format is not the easiest to work, I'd advice to use the [normalize](#normalized), [simplified](#simplified) or [your own](#custom) response parsers.

## normalized

Using a normalized response will combine all `relationships` with `included` data. An example:

```json
{
    "data": {
        "type": "campaign",
        "id": "id",
        "attributes": {
            "created_at": "<date>"
        },
        "relationships": {
            "creator": {
                "data": {
                    "type": "user",
                    "id": "user_id"
                }
            }
        }
    },
    "included": [
        {
            "type": "user",
            "id": "user_id",
            "attributes": {
                "full_name": "John Doe"
            }
        }
    ]
}
```

Will be converted to:

```json
{
    "type": "campaign",
    "id": "id",
    "created_at": "<date>",
    "creator": {
        "type": "user",
        "id": "user_id",
        "full_name": "John Doe"
    }
}
```

## simplified

The `simplify` method will both [`normalize`](#normalized) the response and convert all keys to camelCase.

<<< @/examples.ts#transform-simplify

## custom

You can also create a custom payload parser to append certain attributes or modify the request in a different way.

To register a custom parser, use [module augmentation](../configuration#module-augmentation) for the correct types.
Add a key to `ResponseTransformMap` with a function that satisfies `(res: GetResponsePayload<Query>) => any`.

> [!WARNING]
> Since I don't know how (or it is not possible) to do module augmentation with generics, `response` will be typed as `never`.
> When you create your custom parser, you will be able to see the correct types for `response`.

An example for adding a `campaign_id` to every campaign:

```ts
import type { BasePatreonQuery, GetResponsePayload } from 'patreon-api.ts'

module 'patreon-api.ts' {
    interface ResponseTransformMap<Query extends BasePatreonQuery> {
        custom: (response: GetResponsePayload<Query>) => {
            response: GetResponsePayload<Query>
            campaign_id: string
        }
    }
}
```

Then you can call and test your parser:

```ts
import { PatreonCreatorClient, GetResponsePayload } from 'patreon-api.ts'

const client = new PatreonCreatorClient({
    // ...your options
})

// ...

// Use the same key as in the module augmentation above
const parser = PatreonCreatorClient.createCustomParser(client, 'custom', false, (res) => ({
    response: res,
    campaign_id: '123',
}))

parser.fetchCampaigns(query)
    .then(payload => payload.response.data[0].relationships.creator.data.id)
```
