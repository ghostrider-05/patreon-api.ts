/* eslint-disable jsdoc/require-returns */
export const Routes = {
    /**
     * Routes for:
     *
     * - GET `/identity`
     */
    identity () {
        return '/identity' as const
    },

    /**
     * Routes for:
     *
     * - GET `/campaigns/{campaignId}`
     * @param campaignId The id of the campaign to fetch
     */
    campaign (campaignId: string) {
        return `/campaigns/${campaignId}` as const
    },

    /**
     * Routes for:
     *
     * - GET `/campaigns/{campaignId}/posts`
     * @param campaignId The id of the campaign to fetch the posts of
     */
    campaignPosts (campaignId: string) {
        return `/campaigns/${campaignId}/posts` as const
    },

    /**
     * Routes for:
     *
     * - GET `/campaigns`
     */
    campaigns () {
        return '/campaigns' as const
    },

    /**
     * Routes for:
     *
     * - GET `/campaigns/{campaignId}/members`
     * @param campaignId The id of the campaign to fetch the members for
     */
    campaignMembers (campaignId: string) {
        return `/campaigns/${campaignId}/members` as const
    },

    /**
     * Routes for:
     *
     * - GET `/members/{memberId}
     * @param memberId The id of the member to fetch
     */
    member (memberId: string) {
        return `/members/${memberId}` as const
    },

    /**
     * Routes for:
     *
     * - GET `/posts/{postId}`
     * @param postId The id of the post to fetch
     */
    post (postId: string) {
        return `/posts/${postId}` as const
    },

    /**
     * Routes for:
     *
     * - PATCH `/webhooks/{webhookId}`
     * - DELETE `/webhooks/{webhookId}`
     * @param webhookId The id of the webhook
     */
    webhook (webhookId: string) {
        return `/webhooks/${webhookId}` as const
    },

    /**
     * Routes for:
     *
     * - GET `/webhooks`
     * - POST `/webhooks`
     */
    webhooks () {
        return '/webhooks' as const
    },
}

/** @deprecated use Routes instead */
export const Oauth2Routes = Routes
