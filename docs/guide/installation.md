---
features:
  - title: Cloudflare webhook
    details: Worker to forward Patreon posts to Discord
    link: https://github.com/ghostrider-05/patreon-api.ts/tree/main/examples/cloudflare-webhook/
    linkText: See on GitHub
  # - title: Express.js webhook
  #   details: Server to forward Patreon posts to Discord
  #   link: https://github.com/ghostrider-05/patreon-api.ts/tree/main/examples/express-webhook/
  #   linkText: See on GitHub
  - title: Node.js - ESM
    details: Fetch creator campaigns and update or create webhooks
    link: https://github.com/ghostrider-05/patreon-api.ts/tree/main/examples/node-esm/
    linkText: See on GitHub
  - title: Node.js - CJS
    details: Fetch creator campaigns and module augmentation
    link: https://github.com/ghostrider-05/patreon-api.ts/tree/main/examples/node-cjs/
    linkText: See on GitHub
---

# Installation

## Platform

<!-- @include: ../../README.md#compatibility -->

## Set up

This package exports both CJS and ESM code. However, the guide will only have ESM examples.

::: code-group

```sh [npm]
npm install patreon-api.ts
```

```sh [pnpm]
pnpm add patreon-api.ts
```

```sh [yarn]
yarn add patreon-api.ts
```

:::

<!-- @include: ../../README.md#api-versions -->

## Examples

To get started you can see one of the examples:

<Features />

or read more about [the features your application needs](./features/).

<script setup>
import Features from '../.vitepress/components/DocFeatures.vue'
</script>
