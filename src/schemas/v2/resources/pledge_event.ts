/**
 * The record of a pledging action taken by the user, or that action's failure.
 */
export interface PledgeEvent {
    /**
     * Amount (in the currency in which the patron paid) of the underlying event
     * @example 500
     */
    amount_cents: number

    /**
     * ISO code of the currency of the event
     */
    currency_code: string

    /**
     * The date which this event occurred
     * @format date-time
     */
    date: string

    /**
     * The payment status of the pledge
     */
    pledge_payment_status:
        | 'queued'
        | 'pending'
        | 'valid'
        | 'declined'
        | 'fraud'
        | 'disabled'

    /**
     * Status of underlying payment
     */
    payment_status:
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

    /**
     * Id of the tier associated with the pledge
     */
    tier_id: string | null

    /**
     * Title of the reward tier associated with the pledge
     */
    tier_title: string | null

    /**
     * Event type.
     */
    type:
        | 'pledge_start'
        | 'pledge_upgrade'
        | 'pledge_downgrade'
        | 'pledge_delete'
        | 'subscription'
}
