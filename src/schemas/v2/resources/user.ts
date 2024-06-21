// Copied from a /campaigns/id response since no documentation is present
// TODO: update on new docs
type RawSocialConnections = {
    'discord': {
        'scopes': string[],
        'user_id': string
    },
    'facebook': null,
    'google': null,
    'instagram': null,
    'reddit': null,
    'spotify': null,
    'spotify_open_access': null,
    'tiktok': null,
    'twitch': null,
    'twitter': {
        'url': string,
        'user_id': string
    },
    'twitter2': null,
    'vimeo': null,
    'youtube': null
}

export type SocialConnectionPlatform = keyof RawSocialConnections

export interface User {
    /**
     * The user's about text, which appears on their profile
     */
    about: string | null

    /**
     * Whether this user can view nsfw content
     */
    can_see_nsfw: boolean | null

    /**
     * Datetime of this user's account creation
     */
    created: string

    /**
     * The user's email address.
     * Requires certain scopes to access.
     * See the scopes section of the documentation
     */
    email: string

    /**
     *
     */
    first_name: string | null

    /**
     * Combined first and last name
     */
    full_name: string

    /**
     * Whether the user has chosen to keep private which creators they pledge to
     */
    hide_pledges: boolean | null

    /**
     * The user's profile picture URL, scaled to width 400px
     */
    image_url: string

    /**
     * Whether the user has confirmed their emai
     */
    is_email_verified: boolean

    /**
     *
     */
    last_name: string | null

    /**
     * How many posts this user has liked
     */
    like_count: number

    /**
     * Mapping from user's connected app names to external user id on the respective app
     *
     * NOTE: since the documentation is `object`, this can change without notice.
     * For a more accurate representation use the following type:
     * ```ts
     * type SocialConnections = {
            [P in SocialConnectionPlatform]: (P extends 'discord'
                ? { scopes: string[], user_id: string }
                : P extends 'twitter'
                    ? { url: string, user_id: string }
                    : string
            ) | null
        }
     * ```
     */
    social_connections: Record<string, string | null>

    /**
     * The user's profile picture URL, scaled to a square of size 100x100px
     */
    thumb_url: string

    /**
     * URL of this user's creator or patron profile
     */
    url: string

    /**
     * The public "username" of the user.
     * patreon.com/ goes to this user's creator page.
     * Non-creator users might not have a vanity.
     * @deprecated use Campaign.vanity
     */
    vanity: string | null
}