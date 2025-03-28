# Webhooks

## Webhook API

You can use the [Webhook API](https://docs.patreon.com/#apiv2-webhook-endpoints) to see or edit the webhooks your application has created.

<<< @/examples/oauth/webhook.ts#api-client{ts twoslash}

### Fetch webhooks

<<< @/examples/oauth/webhook.ts#api-fetch{ts twoslash}

### Create a webhook

You can create a new webhook for a certain campaign and specify the triggers and where to post to.

<<< @/examples/oauth/webhook.ts#api-create{ts twoslash}

### Edit a webhook

You can edit the triggers and uri of the webhook you specified [while creating the webhook](#create-a-webhook).

<<< @/examples/oauth/webhook.ts#api-update{ts twoslash}

If a webhook has failed to send events due to an outage or incorrect deploy, it will be paused. To unpause the webhook later, set `paused` to false:

<<< @/examples/oauth/webhook.ts#api-update-pause{ts twoslash}

### Delete a webhook

> [!WARNING]
> This will be unstable until the Patreon documentation has added this method.
> See [this issue](https://github.com/Patreon/platform-documentation/issues/89) for more details.

<<< @/examples/oauth/webhook.ts#api-delete{ts twoslash}

## Webhook server

Both methods for verifying requests will work with the following request libraries:

- Node.js v18+ (Undici) or request / response classes with the same methods
- HTTP server with `IncomingRequest` (and `{ body: any }` being the JSON parsed request body) or a library that is built on this module.

### Verify requests

To create a server for reading webhook payloads it is recommended to verify the incoming request from Patreon.

<<< @/examples/oauth/webhook.ts#verify{ts twoslash}

You can get the webhook secret from the developer portal for your own webhooks or use `<webhook>.attributes.secret` for webhooks created by your application.

### Parse and verify

The library also exposes an `parseWebhookRequest` utility to verify and parse the trigger:

<<< @/examples/oauth/webhook.ts#parse{ts twoslash}

If your webhook only has one (type) of event you can also pass that event as a generic parameter:

<<< @/examples/oauth/webhook.ts#parse-type{ts twoslash}

### Payload client

To quickly access common attributes, such as the campaign or user that triggered the webhook, you can use the payload client:

<<< @/examples/oauth/webhook.ts#payload-client{ts twoslash}

#### Convert payload

One usecase for a webhook server is to forward the event to another platform(s) using webhooks.
Since all platforms have a different webhook body you must convert the JSON:API payload from Patreon into a different JSON object.
To help with this conversion, you can use the payload client:

:::code-group

<<< @/examples/oauth/webhook.ts#payload-convert-discord-posts{ts twoslash} [Posts published]

:::
