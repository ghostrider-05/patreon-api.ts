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
     */
    campaign (campaignId: string) {
        return `/campaigns/${campaignId}` as const
    },

    /**
     * Routes for:
     *
     * - GET `/campaigns/{campaignId}/posts`
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
     */
    campaignMembers (campaignId: string) {
        return `/campaigns/${campaignId}/members` as const
    },

    /**
     * Routes for:
     *
     * - GET `/members/{memberId}
     */
    member (memberId: string) {
        return `/members/${memberId}` as const
    },

    /**
     * Routes for:
     *
     * - GET `/posts/{postId}`
     */
    post (postId: string) {
        return `/posts/${postId}` as const
    }
}

