/**
 * A livestream associated with a campaign post.
 *
 * The Live APIs are early-access, and may be subject to change based on feedback from our partners.
 */
export interface Live {
    /**
     * The description of the livestream
     */
    description: string | null

    /**
     * The RTMP URL for streaming
     */
    rtmp_url: string | null

    /**
     * The scheduled start time of the livestream
     * @format date-time
     */
    scheduled_for: string | null

    /**
     * The current state of the livestream
     *
     * Valid state transitions:
     * - From pre_live, can only go to live
     * - From live, can only go to live_ended
     * - From live_ended, no further transitions
     */
    state: string

    /**
     * The stream key for RTMP streaming
     */
    stream_key: string | null

    /**
     * The title of the livestream
     */
    title: string | null
}
