---
layout: home
targets:
  - apps
  - games
  - bots
hero:
  name: patreon-api.ts
  text: Monetize your <span class="hero-target">bots</span> with Patreon
  tagline: A TypeScript wrapper for the Patreon V2 API
  image: https://c14.patreon.com/wxgaplus_Patreon_Symbol_6fff9723d3.png
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/ghostrider-05/patreon-api.ts

features:
  - title: JSON:API typed
    details: Get accurate types for using the Patreon JSON:API. The types will display the exact resources you requested
    link: https://jsonapi.org/
    linkText: JSON:API documentaton
  - title: 100% coverage
    details: This library supports all documented endpoints for the version 2 API
    link: https://docs.patreon.com/#apiv2-resource-endpoints
    linkText: Patreon documentation
  - title: ESM & CJS
    details: Works with ESM and CJS projects on Node.js and edge platfroms, like Cloudflare, and no dependencies
    link: /guide/installation#platform
    linkText: See runtime requirements
  - title: Simplified payloads
    details: Don't want to deal with the JSON:API? Use the simplified payloads
    link: /guide/features/simplify
    linkText: Read more
  - title: Webhook server
    details: Verify (and parse) incoming webhook requests to your own server
    link: /guide/features/webhook
    linkText: Read more
  - title: Sandbox
    details: Test your application before it goes live and without paying to yourself
    link: /guide/features/sandbox
    linkText: Read more
---

<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { useData, useRouter } from 'vitepress'
import { useIntervalFn } from '@vueuse/core'

const { page } = useData()
let index = 0

function replaceTarget () {
  if (page.value.frontmatter.layout !== 'home') return
  const { targets } = page.value.frontmatter

  document.getElementsByClassName('hero-target').item(0).innerHTML = targets[index]
  index = (targets.length - 1) === index ? 0 : ++index
}

const { pause, resume, isActive } = useIntervalFn(() => {
  replaceTarget()
}, 5_000)

onMounted(() => nextTick(() => resume()))
</script>

<style>
.hero-target {
  color: var(--vp-c-brand-1) !important;
}

.image-src {
  border-radius: 10px;
}
</style>
