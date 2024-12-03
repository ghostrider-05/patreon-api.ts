import { type CustomTypeOption } from '../../../utils/'

/** @deprecated will be removed in future version */
export type SocialConnectionPlatform = keyof {
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

/**
 * The Patreon user, which can be both patron and creator.
 */
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
     * @format date-time
     */
    created: string

    /**
     * The user's email address.
     * Requires certain scopes to access.
     * See the scopes section of the documentation
     * @format email
     */
    email: string

    /**
     * First name.
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
     * @format uri
     */
    image_url: string

    /**
     * Whether this user has an active campaign.
     */
    is_creator: boolean

    /**
     * Whether the user has confirmed their email
     */
    is_email_verified: boolean

    /**
     * Last name.
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
     * For a more accurate representation use the following type using TypeScript module augmentation:
     * ```ts
     * import 'patreon-api.ts'
     *
     * declare module 'patreon-api.ts' {
     *    interface CustomTypeOptions {
     *        social_connections: Record<string, { url: string, user_id: string } | null>
     *    }
     * }
     * ```
     */
    social_connections: CustomTypeOption<'social_connections', object>

    /**
     * The user's profile picture URL, scaled to a square of size 100x100px
     * @format uri
     */
    thumb_url: string

    /**
     * URL of this user's creator or patron profile
     * @format uri
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
