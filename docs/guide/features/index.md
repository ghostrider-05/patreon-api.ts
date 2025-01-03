# Features

## Authorization

The patreon API is only accessible by using Oauth. You can choose between two types of applications:

- [Creator account](./oauth#creator-token)
- [User Oauth](./oauth#user-oauth2)

For both types of applications you will need to create a client in the developer portal. Copy the client id and secret and store them in your secrets. You can also find the creator access and refresh tokens in the client information.

## Request

When you have created the application, you're ready to make a request.

> [!NOTE]
> In API v2, [all attributes must be explicitly requested](https://docs.patreon.com/#apiv2-oauth).

You can use the methods on the client:

```ts
function fetchPatreon (client) {
    // Get the full name of the creator of the campaign
    const query = buildQuery.campaigns(['creator'])({ creator: ['full_name']})

    // get the campaigns
    const campaigns = await client.fetchCampaigns(query)
    // or fetch the post(s), member(s), post(s) or current user 

    // Or list resources to paginate multiple pages
    for await (const campaign of client.listCampaigns(query)) {
        console.log(campaign.id)
    }
}
```

Or use the raw request methods:

```ts
function fetchPatreon (client) {
    const query = createQuery(new URLSearchParams())

    // get the campaigns
    const campaigns = await client.fetchOauth2(OauthRoutes.campaigns(), query)
    // or fetch the post(s), member(s), post(s) or current user 

    // Or list resources to paginate multiple pages
    for await (const campaign of client.listOauth2(OauthRoutes.campaigns(), query)) {
        console.log(campaign.id)
    }
}
```

> [!NOTE] Tip
> My advice is to write your own wrapper / class that uses a client with all attributes and included resources configured.

:::details Wrapper example

```ts
export class PatreonWrapper {
    public client: PatreonCreatorClient

    public constructor () {
        this.client = new PatreonCreatorClient({
            // Add your own token to the options
            oauth: {
                clientId: process.env.CLIENT_ID!,
                clientSecret: process.env.CLIENT_SECRET!,
            },
        })
    }

    public async fetchCampaign () {
        const query = buildQuery.campaign(['tiers'])({
            campaign: [
                'is_monthly',
                'is_charged_immediately',
                'image_url',
                'patron_count',
            ],
            tier: [
                'amount_cents',
                'title',
                'patron_count',
            ],
        })

        return await this.client.fetchCampaign('id', query) 
    }
}
```

:::

## Responses

When fetching a resource the response is a JSON:API response and is typed based on the query, see [the introduction](../introduction).

You can also [normalize](./simplify) responses to connect the relationships and included.

## Testing

Not ready to connect your Patreon account to your application? Test your app with [the sandbox](./sandbox) with sample payloads.
