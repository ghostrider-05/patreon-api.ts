export interface Benefit {
    /**
     * The third-party external ID this reward is associated with
     */
    app_external_id: string | null

    /**
     * Any metadata the third-party app included with this benefit on creation
     */
    app_meta: object | null

    /**
     * Type of benefit, such as `custom` for creator-defined benefits
     */
    benefit_type: string | null

    /**
     * Datetime this benefit was created
     */
    created_at: string

    /**
     * Number of deliverables for this benefit that are due today specifically
     */
    deliverables_due_today_count: number

    /**
     * Number of deliverables for this benefit that have been marked complete
     */
    delivered_deliverables_count: number

    /**
     * Display description
     */
    description: string | null

    /**
     * Whether this benefit has been deleted
     */
    is_deleted: boolean

    /**
     * Whether this benefit is no longer available to new patrons
     */
    is_ended: boolean

    /**
     * Whether this benefit is ready to be fulfilled to patrons
     */
    is_published: boolean

    /**
     * The next due date (after EOD today) for this benefit
     */
    next_deliverable_due_date: string | null

    /**
     * Number of deliverables for this benefit that are due, for all dates
     */
    not_delivered_deliverables_count: number

    /**
     * A rule type designation, such as `eom_monthly` or `one_time_immediate`
     */
    rule_type: string | null

    /**
     * Number of tiers containing this benefit
     */
    tiers_count: number

    /**
     * Display title
     */
    title: string
}