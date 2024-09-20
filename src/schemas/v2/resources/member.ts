export interface Member {
    /**
     * 	The total amount that the member has ever paid to the campaign in campaign's currency.
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
     */
    full_name: string

    /**
     * The user is not a pledging patron but has subscribed to updates about public posts
     */
    is_follower: boolean

    /**
     * Datetime of last attempted charge.
     * `null` if never charged
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
        | 'Fraud'
        | 'Other'
        | null

    /**
     * The total amount that the member has ever paid to the campaign.
     * 0 if never paid
     */
    lifetime_support_cents: number

    /**
     * Datetime of next charge.
     * `null` if annual pledge downgrade
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
     */
    pledge_cadence: number

    /**
     * Datetime of beginning of most recent pledge chainfrom this member to the campaign.
     * Pledge updates do not change this value
     */
    pledge_relationship_start: string | null

    /**
     * The amount in cents the user will pay at the next pay cycle
     */
    will_pay_amount_cents: number
}