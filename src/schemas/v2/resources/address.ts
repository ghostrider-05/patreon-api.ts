export interface Address {
    /**
     * Full recipient name
     */
    addressee: string | null

    /**
     *
     */
    city: string

    /**
     *
     */
    country: string

    /**
     * Datetime address was first created
     */
    created_at: string

    /**
     * First line of street address
     */
    line_1: string | null

    /**
     * Second line of street address
     */
    line_2: string | null

    /**
     * Telephone number. Specified for non-US addresses
     */
    phone_number: string | null

    /**
     * Postal or zip code
     */
    postal_code: string | null

    /**
     * State or province name
     */
    state: string | null
}