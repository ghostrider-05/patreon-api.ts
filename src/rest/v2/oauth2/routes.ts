/* eslint-disable jsdoc/require-returns */
export const Oauth2Routes = {
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
     * @param {string} campaignId The id of the campaign to fetch
     */
    campaign (campaignId: string) {
        return `/campaigns/${campaignId}` as const
    },

    /**
     * Routes for:
     *
     * - GET `/campaigns/{campaignId}/posts`
     * @param {string} campaignId The id of the campaign to fetch the posts of
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
     * @param {string} campaignId The id of the campaign to fetch the members for
     */
    campaignMembers (campaignId: string) {
        return `/campaigns/${campaignId}/members` as const
    },

    /**
     * Routes for:
     *
     * - GET `/members/{memberId}
     * @param {string} memberId The id of the member to fetch
     */
    member (memberId: string) {
        return `/members/${memberId}` as const
    },

    /**
     * Routes for:
     *
     * - GET `/posts/{postId}`
     * @param {string} postId The id of the post to fetch
     */
    post (postId: string) {
        return `/posts/${postId}` as const
    }
}

