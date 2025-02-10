/* eslint-disable indent */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable jsdoc/require-jsdoc */
import {
    createQuery,
    Oauth2StoredToken,
    // @ts-expect-error duplicate-imports
    PatreonClient,
    PatreonCreatorClient,
    PatreonQuery,
    PatreonStore,
    PatreonStoreKVStorage,
    PatreonUserClient,
    // @ts-expect-error duplicate-imports
    QueryBuilder,
    Routes,
    simplify,
    simplifyFromQuery,
    Type,
} from '../'

declare const client: PatreonCreatorClient

declare const env: {
    CLIENT_ID: string
    CLIENT_SECRET: string
    KV_STORE: PatreonStoreKVStorage

    CREATOR_ACCESS_TOKEN: string
    CREATOR_REFRESH_TOKEN: string
}

// #region readme
const query = QueryBuilder.campaign
    .setAttributes({ campaign: ['patron_count'] })

const payload = await client.fetchCampaign('campaign_id', query)
    // ^? { data: { attributes: { patron_count: number } }, ... }
const campaign = await client.normalized.fetchCampaign('campaign_id', query)
    // ^? { patron_count: number, id: string, type: Type.Campaign }

// #endregion readme
// @ts-expect-error duplicate-imports
// #region fetch
import { type PatreonClient, QueryBuilder } from 'patreon-api.ts'

async function fetchPatreon (client: PatreonClient) {
    // Get the full name of the creator of the campaign
    const query = QueryBuilder.campaigns
        .addRelationships(['creator'])
        .addRelationshipAttributes('creator', ['full_name'])

    // get the campaigns
    const campaigns = await client.fetchCampaigns(query)
    // or fetch the post(s), member(s), post(s) or current user

    // Or list resources to paginate multiple pages
    for await (const campaigns of client.paginateCampaigns(query)) {
        for (const campaign of campaigns.data) {
            console.log(campaign.id)
        }
    }
}

// #endregion fetch
// #region fetch-raw
async function fetchPatreonRaw (client: PatreonClient) {
    type Query = PatreonQuery<Type.Campaign, 'creator', {
        user: ('full_name')[]
    }, true>

    const query = createQuery<Query>(new URLSearchParams({
        include: 'creator',
        'fields[user]': 'full_name',
    }))

    // get the campaigns
    const campaigns = await client.fetchOauth2(Routes.campaigns(), query)
    // or fetch the post(s), member(s), post(s) or current user

    // Or list resources to paginate multiple pages
    for await (const campaigns of client.paginateOauth2(Routes.campaigns(), query)) {
        for (const campaign of campaigns.data) {
            console.log(campaign.id)
        }
    }
}

// #endregion fetch-raw
// #region fetch-wrapper
class PatreonWrapper {
    public client: PatreonCreatorClient<true>

    public constructor () {
        this.client = new PatreonCreatorClient({
            // Add your own token to the options
            oauth: {
                clientId: env.CLIENT_ID,
                clientSecret: env.CLIENT_SECRET,
            },
            rest: {
                includeAllQueries: true,
            }
        })
    }

    public async fetchCampaign () {
        const query = QueryBuilder.campaign
            .addRelationships(['tiers'])
            .setAttributes({
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

    public async fetchMembers () {
        return await this.client.simplified.fetchCampaignMembers('id')
    }
}

// #endregion fetch-wrapper

// #region store-custom
// Use stored tokens in a database
// And directly call the `store.get` method on starting the client
const customStoreClient = new PatreonCreatorClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
    },
    name: '<application>', // The application name in the dashboard
    store: {
        get: async () => {
            // Get your stored token
            return <never>{
                access_token: '<token>',
                //...refresh, expires, etc.
            }
        },
        put: async (token) => {
            console.log(JSON.stringify(token))
            // save your token
        }
    }
})

// #endregion store-custom
// #region store-kv
// Use stored tokens in a database
// And directly call the `store.get` method on starting the request
const kvStoreClient = new PatreonCreatorClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
    },
    name: '<application>',
    store: new PatreonStore.KV(env.KV_STORE, 'key'),
})

// #endregion store-kv
// #region client-creator
const creatorClient = new PatreonCreatorClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
        // Either set the token in the options
        // or configure a store and call <Client>.initialize()
        token: {
            access_token: env.CREATOR_ACCESS_TOKEN,
            refresh_token: env.CREATOR_REFRESH_TOKEN,
        },
    },
    store: new PatreonStore.Fetch('<url>'),
})

// #endregion client-creator

declare function storeToken (user: unknown, token: unknown): Promise<void>

// #region client-user
// Minimal configuration for handling Oauth2
const userClient = new PatreonUserClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
        redirectUri: '<uri>',
    }
})

export default {
    // The Oauth2 callback request with the code parameter
    fetch: async (request: Request) => {
        const query = QueryBuilder.identity.setAttributes({
            user: ['is_creator']
        })

        // Instance will have the token associated with
        const instance = await userClient.createInstance(request)
        const user = await instance.fetchIdentity(query)

        // Store the (access &) refresh token if you need to make a request later
        await storeToken(user, instance.token)

        // Check if the user has access
    }
}

// #endregion client-user

// #region transform-normalize


// #endregion transform-normalize
// #region transform-simplify
const campaignQuery = QueryBuilder.campaign
    .addRelationships(['creator'])
    .setAttributes({ campaign: ['created_at'], user: ['full_name'] })

const rawCampaign = await client.fetchCampaign('campaign_id', campaignQuery)

const simplified = simplify(rawCampaign)
console.log(`Campaign by ${simplified.creator.fullName} created at ${simplified.createdAt}`)

const postsQuery = QueryBuilder.campaignPosts
    .addRelationships(['campaign'])
    .setAttributes({ campaign: ['created_at'], post: ['is_paid', 'title']  })

const campaignPosts = await client.fetchCampaignPosts('campaign_id', postsQuery)

const posts = simplify(campaignPosts)
for (const post of posts.data) {
    console.log(`Post ${post.title} is paid: ${post.isPaid}`)
}

// #endregion transform-simplify


// #region transform-default
const defaultIncludeClient = new PatreonCreatorClient({
    oauth: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
    },
    rest: {
        includeAllQueries: true,
    }
})

const campaigns = await defaultIncludeClient.simplified.fetchCampaigns()

for (const campaign of campaigns.data) {
    console.log(
        campaign.tiers[0].patronCount,
        campaign.creator.isCreator,
        campaign.url,
    )
}
// #endregion transform-default