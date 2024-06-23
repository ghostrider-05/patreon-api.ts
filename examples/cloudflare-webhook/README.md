# Patreon posts to Discord

This is an example project for how to connect `patreon-api.ts` with Cloudflare Workers to send Discord messages on a new post.

Discord message:

![Discord message preview](./assets/discord.png)

Patreon post:

![Patreon post preview](./assets/patreon.png)

## Getting started

1. Clone / copy `/examples/cloudflare-webhook/` locally
2. Install dependencies: `npm install`
3. Get the webhook secret from Patreon by registering a new webhook using the Patreon API. You can use the [`node-esm`](../nodejs-esm/index.js) example to register the webhook and view its secret.
4. Update [the secrets](#secrets) on Cloudlfare to use your webhook
5. Deploy the worker with `npm run deploy` to your Cloudflare account
6. Create a post on Patreon and view the Discord message!

### Secrets

Update the following secrets using `wrangler`:

- `DISCORD_WEBHOOK_URL`: the url of the Discord webhook. You can click the `Copy url` button in the Discord client to get the url
- `PATREON_WEBHOOK_SECRET`: the webhook secret of your Patreon clients webhook.
