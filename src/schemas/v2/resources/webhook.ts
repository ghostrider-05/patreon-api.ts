/**
 * Webhooks are fired based on events happening on a particular campaign.
 */
export interface Webhook {
    /**
     * Last date that the webhook was attempted or used.
     * @format date-time
     */
    last_attempted_at: string

    /**
     * Number of times the webhook has failed consecutively, when in an error state.
     * @example 0
     * @example 2
     */
    num_consecutive_times_failed: number

    /**
     * `true` if the webhook is paused as a result of repeated failed attempts to post to uri.
     * Set to `false` to attempt to re-enable a previously failing webhook.
     */
    paused: boolean

    /**
     * Secret used to sign your webhook message body, so you can validate authenticity upon receipt.
     */
    secret: string

    /**
     * List of events that will trigger this webhook.
     */
    triggers: string[]

    /**
     * Fully qualified uri where webhook will be sent
     * @format uri
     * @example 'https://www.example.com/webhooks/incoming'
     */
    uri: string
}

export type PatchWebhookBody = Partial<Pick<Webhook,
    | 'paused'
    | 'triggers'
    | 'uri'
>>

export type PostWebhookBody = Pick<Webhook,
    | 'triggers'
    | 'uri'
>
