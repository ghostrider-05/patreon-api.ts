export interface ListRequestPaginationPayload {
    total: number
    // This can be null according to the JSON:API (I think)
    // But it is always returned from my observation, so I don't think I know if it should be optional
    // Leaving it now for how it was before.
    cursors?: {
        next: string | null
    }
}
