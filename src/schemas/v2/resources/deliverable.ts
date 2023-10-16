export interface Deliverable {
    /**
     * When the creator marked the deliverable as completed or fulfilled to the patron
     */
    completed_at: string | null

    delivery_status:
        | 'delivered'
        | 'not_delivered'
        | 'wont_deliver'

    /**
     * When the deliverable is due to the patron
     */
    due_at: string
}