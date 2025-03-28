import { PatreonCreatorClient } from 'patreon-api.ts'

// Use your own client with configuration
declare const client: PatreonCreatorClient

console.log('User agent used by client:', client.oauth.userAgent)