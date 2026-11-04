import type { CustomTypeOption } from '../../../utils/'

/**
 * The record of a user's membership to a campaign.
 * Remains consistent across months of pledging.
 */
export interface Member {
    /**
     * The total amount that the member has ever paid to the campaign in the campaign's currency.
     * 0 if never paid
     */
    campaign_lifetime_support_cents: number | null

    /**
     * The amount in cents that the member is entitled to.
     * This includes a current pledge, or payment that covers the current payment period
     */
    currently_entitled_amount_cents: number

    /**
     * The member's email address.
     * Requires the campaigns.members[email] scope.
     * Members may restrict the sharing of their email address.
     */
    email: string | null

    /**
     * Full name of the member user.
     * Can be empty if the user has opted to hide their identity for this membership.
     * @example John Doe
     */
    full_name: string | null

    /**
     * The user is not a pledging patron but has subscribed to updates about public posts.
     * This will always be false, following has been replaced by free membership.
     * @deprecated
     */
    is_follower: boolean | null

    /**
     * The user is in a free trial period.
     */
    is_free_trial: boolean | null

    /**
     * The user's membership is from a free gift
     */
    is_gifted: boolean

    /**
     * Datetime of last attempted charge.
     * `null` if never charged
     * @format date-time
     */
    last_charge_date: string | null

    /**
     * Note: The result of the last attempted charge. The only successful status is `'Paid'`.
     */
    last_charge_status: CustomTypeOption<'member_charge_status', string> | null

    /**
     * The total amount that the member has ever paid to the campaign in the campaign's currency.
     * 0 if never paid.
     *
     * Use {@link campaign_lifetime_support_cents}.
     * @deprecated
     */
    lifetime_support_cents: number | null

    /**
     * Datetime of next charge.
     * `null` if annual pledge downgrade
     * @format date-time
     */
    next_charge_date: string | null

    /**
     * The creator's notes on the member
     */
    note: string

    /**
     * Note: A `null` value indicates the member has never pledged
     */
    patron_status: CustomTypeOption<'member_patron_status', string>| null

    /**
     * Number of months between charges
     *
     * Note: this will be `1` if Campaign.is_monthly is `true`
     * Note: this used to be documented as an integer.
     * @example 1
     */
    pledge_cadence: string | null

    /**
     * Datetime of beginning of most recent pledge chain from this member to the campaign.
     * Pledge updates do not change this value
     * @format date-time
     */
    pledge_relationship_start: string | null

    /**
     * The amount in cents the user will pay at the next pay cycle
     * @example 500
     */
    will_pay_amount_cents: number
}
