/**
 * Content posted by a creator on a campaign page.
 */
export interface Post {
    /**
     * Platform app id
     */
    app_id: number | null

    /**
     * Processing status of the post
     */
    app_status: string | null

    // TODO: no description
    /**
     *
     */
    content: string | null

    // TODO: is None equal to null?
    /**
     * An object containing embed data if media is embedded in the post
     */
    embed_data: object | null

    /**
     * Embed media url
     * @format uri
     */
    embed_url: string | null

    /**
     * Whether the post incurs a bill as part of a pay-per-post campaign
     */
    is_paid: boolean | null

    /**
     * - `true` if the post is viewable by anyone
     * - `false` if only patrons (or a subset of patrons) can view
     */
    is_public: boolean | null

    /**
     * Datetime that the creator most recently published (made publicly visible) the post
     * @format date-time
     */
    published_at: string | null

    // TODO: why is the type Tier[], but description string[]?
    /**
     * The tier ids that allow the patrons from those tiers to view the post.
     * Empty array if no tiers assigned even if {@link Post.is_paid} is true
     */
    tiers: string[]

    // TODO: no description
    /**
     *
     */
    title: string | null

    /**
     * A URL to access this post on patreon.com
     * @format uri
     */
    url: string
}
