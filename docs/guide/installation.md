---
features:
  - title: Cloudlfare webhook
    details: Worker to forward Patreon posts to Discord
    link: https://github.com/ghostrider-05/patreon-api.ts/tree/main/examples/cloudflare-webhook/
    linkText: See on GitHub
  - title: Node.js - ESM
    details: Fetch creator campaigns and update or create webhooks
    link: https://github.com/ghostrider-05/patreon-api.ts/tree/main/examples/node-esm/
    linkText: See on GitHub
  - title: Node.js - CJS
    details: Fetch creator campaigns
    link: https://github.com/ghostrider-05/patreon-api.ts/tree/main/examples/node-cjs/
    linkText: See on GitHub
---

# Installation

## Platform

<!-- @include: ../../README.md{41,51} -->

## Set up

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

<!-- @include: ../../README.md{26,35} -->

To get started you can see one of the examples:

<Features />

or read more about [the features your application needs](./features/).

<script setup>
import Features from '../node_modules/vitepress/dist/client/theme-default/components/VPHomeFeatures.vue'
</script>

<style scoped>
:deep(.VPHomeFeatures h2) {
  margin: 0 !important;
  padding: 0 !important;
  border-top: none !important;
}

:deep(.VPHomeFeatures a) {
  text-decoration-line: none;
}

:deep(.VPHomeFeatures p) {
  margin: 0;
}
</style>
