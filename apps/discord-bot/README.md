# Patreon Discord bot

An alternative to the Patreon Discord integration. This is a self hostable bot

## Features

- Your own REST API to check if a Discord member is a patron
- Can be used with:
  - Discord webhooks to:
    - Forward Patreon webhook messages to Discord
    - Create forum posts of Patreon posts
  - application commands scope to:
    - Create slash commands for viewing members & posts
  - bot scope to:
    - Edit and/or delete Discord messages of Patreon posts
    - Announce webhook messages of Patreon posts
    - Add components to Patreon posts messages in Discord
    - Register linked roles to grant custom roles to members

## Linked roles

Linked roles have the following options by default:

- member must be active patron
- member must have tier N
- member must have paid more than N cents (in campaign currency) in total to the campaign
- member must have a verified email
