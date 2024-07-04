---
libraries:
    - title: patreon-api.ts
      link: https://github.com/ghostrider-05/patreon-api.ts
      api: 2
      sandbox: false
      user: true
      creator: true
      webhooks: true
      simplified: true
      raw: true
      fetch_patrons: true
      fetch_identity: true
      all_endpoints: true
    - title: patreon-js
      link: https://github.com/Patreon/patreon-js
      official: true
      api: 1
      sandbox: false
      user: true
      creator: true
      webhooks: false
      simplified: false
      raw: false
      fetch_patrons: true
      fetch_identity: true
      all_endpoints: false
    - title: patreon-discord
      link: https://github.com/miramallows/patreon-discord
      api: 2
      sandbox: false
      user: false
      creator: true
      webhooks: false
      simplified: true
      raw: false
      fetch_patrons: true
      fetch_identity: false
      all_endpoints: false
    - title: patreon-wrapper
      link: https://github.com/AniTrack/patreon-wrapper
      api: 2
      sandbox: true
      user: false
      creator: true
      webhooks: false
      simplified: true
      raw: false
      fetch_patrons: true
      fetch_identity: false
      all_endpoints: false
    - title: skyhook
      link: https://github.com/Commit451/skyhook
      api: 2
      sandbox: false
      user: false
      creator: true
      webhooks: true
      simplified: false
      raw: false
      fetch_patrons: false
      fetch_identity: false
      all_endpoints: false
    - title: passport-patreon
      link: https://github.com/mzmiric5/passport-patreon
      api: 1
      sandbox: false
      user: true
      creator: false
      webhooks: false
      simplified: true
      raw: false
      fetch_patrons: false
      fetch_identity: true
      all_endpoints: false
    - title: patreon-webhooks
      link: https://github.com/mrTomatolegit/patreon-webhooks
      api: 2
      sandbox: false
      user: false
      creator: false
      webhooks: true
      simplified: true
      raw: false
      fetch_patrons: false
      fetch_identity: false
      all_endpoints: false

keys:
  - id: title
    name: Repository
    title: ''
  - id: api
    name: API Version
    title: The API that this library supports
    colors:
      1: red
      2: green
  - id: sandbox
    name: Sandbox
    title: Whether this library has a method to use sample data
    colors: boolean
  - id: user
    name: Oauth
    title: Whether this library has methods for Oauth flow
    colors: boolean
  - id: creator
    name: Creator token
    title: Whether this library has methods to use your own campaign without Oauth
    colors: boolean
  - id: webhooks
    name: Webhooks
    title: Whether this library has methods to handle Patreon webhooks
    colors: boolean
  - id: raw
    name: JSON:API
    title: Whether this library exposes raw access to the JSON:API responses
    colors: boolean
  - id: simplified
    name: Normalized
    title: Whether this library normalizes, simplified to JS objects / classes, responses
    colors: boolean
  - id: fetch_identity
    name: Fetch user
    title: Whether this library has a method to fetch the current user
    colors: boolean
  - id: fetch_patrons
    name: Fetch members
    title: Whether this library has a method to fetch campaign members
    colors: boolean
  - id: all_endpoints
    name: All endpoints
    title: Whether this library has methods to fetch all endpoints
    colors: boolean
---

# Introduction

<!-- @include:../../README.md{8,21} -->

## Comparison

See why I made this library with all* [JavaScript and TypeScript repositories for the Patreon API](https://github.com/search?q=patreon+language:JavaScript+language:TypeScript++archived:false++is:public+stars:%3E0&type=repositories&s=stars&o=desc) compared (scroll to see all features):

<LibraryTable />

:::details Repository requirements

A library is included if it:

- has at least 1 GitHub star
- is written in TypeScript or JavaScript
- is a repo:
  - **not** for scraping, only related to badges, downloading assets or a Patreon clone
  - exports code or is published on NPM
- is not archived

:::

### Contributions

If a library has been updated or a new library has met the requirements above, issues or a pull request are accepted to update this table.

<script setup>
import LibraryTable from '../.vitepress/components/LibraryTable.vue'
</script>
