export interface Tier {
    /**
     * Monetary amount associated with this tier (in U.S. cents)
     */
    amount_cents: number

    /**
     * Datetime this tier was created
     */
    created_at: string

    /**
     * Tier display description
     */
    description: string

    // TODO: what type of object for IDs??
    /**
     * The discord role IDs granted by this tier
     */
    discord_role_ids: object | null

    /**
     * Datetime tier was last modified
     */
    edited_at: string

    /**
     * Full qualified image URL associated with this tier
     */
    image_url: string | null

    /**
     * Number of patrons currently registered for this tier
     */
    patron_count: number

    /**
     * Number of posts published to this tier
     */
    post_count: number

    /**
     * Whether the tier is currently published
     */
    published: boolean

    /**
     * Datetime this tier was last published
     */
    published_at: string | null

    /**
     * Remaining number of patrons who may subscribe, if there is a {@link Tier.user_limit}
     */
    remaining: number | null

    /**
     * Whether this tier requires a shipping address from patrons
     */
    requires_shipping: boolean

    /**
     * Tier display title
     */
    title: string

    /**
     * Datetime tier was unpublished, while applicable
     */
    unpublished_at: string | null

    /**
     * Fully qualified URL associated with this tier
     */
    url: string

    /**
     * Maximum number of patrons this tier is limited to, if applicable
     */
    user_limit: number | null
}