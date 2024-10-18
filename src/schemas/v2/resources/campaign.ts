/**
 * The creator's page, and the top-level object for accessing lists of members, tiers, etc
 */
export interface Campaign {

    /**
     * The campaign's vanity name
     */
    vanity: string | null

    /**
     * The url to visit this campaign
     * @format uri
     */
    url: string

    /**
     * The URL of the video that is shown to patrons after pledging
     * @format uri
     */
    thanks_video_url: string | null

    /**
     * The message that is shown to patrons after pledging
     */
    thanks_msg: string | null

    // TODO: I assume, no description in documentation
    /**
     * The embed that is shown to patrons after pledging
     */
    thanks_embed: string | null

    /**
     * The summary of this campaign.
     * Can be viewed in the About section of the campaign
     */
    summary: string | null

    /**
     * Whether the campaign's total earnings are shown publicly
     */
    show_earnings: boolean

    /**
     * The title of the campaigns rss feed
     */
    rss_feed_title: string | null

    /**
     * The url for the rss album artwork
     * @format uri
     */
    rss_artwork_url: string | null

    /**
     * Datetime that the creator most recently published (made publicly visible) the campaign.
     * Null when the campaign has not been public.
     * @format date-time
     */
    published_at: string | null

    /**
     * Relative (to patreon.com) URL for the pledge checkout flow for this campaign
     */
    pledge_url: string

    /**
     * The thing which patrons are paying per, as in "{@link Campaign.vanity} is making $1000 per {@link Campaign.pay_per_name}"
     */
    pay_per_name: string | null

    /**
     * Number of patrons pledging to this creator
     */
    patron_count: number

    /**
     * Pithy one-liner for this campaign, displayed on the creator page
     */
    one_liner: string | null

    // TODO: no documentation
    /**
     * @format uri
     */
    main_video_url: string | null

    // TODO: no documentation
    /**
     *
     */
    main_video_embed: string | null

    /**
     * Whether the creator has marked the campaign as containing nsfw content
     */
    is_nsfw: boolean

    /**
     * Whether the campaign charges per month
     */
    is_monthly: boolean

    /**
     * Whether the campaign charges upfront
     */
    is_charged_immediately: boolean

    /**
     * Banner image URL for the campaign
     * @format uri
     */
    image_url: string

    /**
     * Profile image URL for the campaign
     * @format uri
     */
    image_small_url: string

    /**
     * Whether the creator has sent a one-time rss notification email
     */
    has_sent_rss_notify: boolean

    /**
     * Whether this user has opted-in to rss feeds
     */
    has_rss: boolean

    /**
     * The ID of the Google Analytics tracker that the creator wants metrics to be sent to
     */
    google_analytics_id: string | null

    /**
     * The ID of the external discord server that is linked to this campaign
     */
    discord_server_id: string | null

    /**
     * The type of content the creator is creating, as in "{@link Campaign.vanity} is creating {@link Campaign.creation_name}"
     */
    creation_name: string | null

    /**
     * Datetime that the creator first began the campaign creation process
     * @format date-time
     */
    created_at: string
}

/** @deprecated use keyof Campaign */
export type CampaignFields = keyof Campaign
