export interface ListRequestPaginationPayload {
    total: number
    cursors?: {
        next: string
    }
}
