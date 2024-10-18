/**
 * The record of whether or not a patron has been delivered the benefit they are owed because of their member tier.
 */
export interface Deliverable {
    /**
     * When the creator marked the deliverable as completed or fulfilled to the patron
     * @format date-time
     */
    completed_at: string | null

    delivery_status:
        | 'delivered'
        | 'not_delivered'
        | 'wont_deliver'

    /**
     * When the deliverable is due to the patron
     * @format date-time
     */
    due_at: string
}
