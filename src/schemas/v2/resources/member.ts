/**
 * The record of a user's membership to a campaign.
 * Remains consistent across months of pledging.
 */
export interface Member {
    /**
     * The total amount that the member has ever paid to the campaign in the campaign's currency.
     * 0 if never paid
     */
    campaign_lifetime_support_cents: number

    /**
     * The amount in cents that the member is entitled to.
     * This includes a current pledge, or payment that covers the current payment period
     */
    currently_entitled_amount_cents: number

    /**
     * The member's email address.
     * Requires the campaigns.members[email] scope
     */
    email: string

    /**
     * Full name of the member user
     * @example John Doe
     */
    full_name: string

    /**
     * The user is not a pledging patron but has subscribed to updates about public posts.
     * This will always be false, following has been replaced by free membership.
     * @deprecated
     */
    is_follower: boolean

    /**
     * The user is in a free trial period.
     */
    is_free_trial: boolean

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
     * The result of the last attempted charge.
     * The only successful status is `'Paid'`.
     * `null` if never charged
     *
     * Note: this will likely be either `'Paid'` or `'Pending'`
     */
    last_charge_status:
        | 'Paid'
        | 'Declined'
        | 'Deleted'
        | 'Pending'
        | 'Refunded'
        | 'Refunded by Patreon'
        | 'Partially Refunded'
        | 'Fraud'
        | 'Free Trial'
        | 'Other'
        | null

    /**
     * The total amount that the member has ever paid to the campaign in the campaign's currency.
     * 0 if never paid.
     *
     * Use {@link campaign_lifetime_support_cents}.
     * @deprecated
     */
    lifetime_support_cents: number

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
     * A `null` value indicates the member has never pledged
     */
    patron_status:
        | 'active_patron'
        | 'declined_patron'
        | 'former_patron'
        | null

    /**
     * Number of months between charges
     *
     * Note: this will be `1` if Campaign.is_monthly is `true`
     * @example 1
     */
    pledge_cadence: number | null

    /**
     * Datetime of beginning of most recent pledge chainfrom this member to the campaign.
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
