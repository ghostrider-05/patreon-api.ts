export interface InternalRetryData {
    retries: number
    backoff: (current: number) => number
}

export interface RestRetriesBackoffOptions {
    /**
     * The time (in ms) to wait between a retried request.
     * Combined with the strategy it will result in a final backoff time.
     */
    time: number

    /**
     * The maximum time (in ms) to add to each backoff.
     * Will be a pseudorandom number between 0 and jitter.
     */
    jitter?: number

    /**
     * The strategy to use.
     * - linear: (retries * time)
     * - exponential: (retries * retries * time)
     * - custom
     */
    strategy:
        | 'linear'
        | 'exponential'
        | ((retries: number, backoff: number) => number)

    /**
     * The maximum time (in ms) the backoff can be (excluding jitter)
     */
    limit?: number
}

export interface RestRetriesOptions {
    retries: number
    backoff?: RestRetriesBackoffOptions
    status?: number | [number, number] | [number, number][]
}

export type RestRetries =
    | number
    | RestRetriesOptions
    | RestRetriesOptions[]

export const defaultRetries = 3 satisfies RestRetries

// eslint-disable-next-line jsdoc/require-jsdoc
function isRetryable (status: number | null, fromOptions = false) {
    return status == null || fromOptions || status >= 500
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function createBackoff (options: RestRetriesBackoffOptions) {
    return (currentRetries: number) => {
        const { strategy, time, limit } = options
        const jitter = options.jitter ? (Math.random() * options.jitter) : 0
        const applyLimit = (time: number) => limit != undefined ? Math.min(limit, time) : time

        if (strategy === 'linear') {
            return applyLimit(time * currentRetries) + jitter
        } else if (strategy === 'exponential') {
            return applyLimit(time * (currentRetries * currentRetries)) + jitter
        } else {
            return applyLimit(strategy(currentRetries, time)) + jitter
        }
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
function getRetryOptions (options: RestRetriesOptions[], status: number | null): RestRetriesOptions | undefined {
    if (status == null) return options.find(option => option.status == undefined)
    const isInRange = (range: [number, number], target: number) => range[0] <= target && range[1] >= target

    const option = options.find(({ status: optionStatus }) => {
        if (optionStatus == undefined) return false

        if (typeof optionStatus === 'number') {
            return optionStatus === status
        } else if (Array.isArray(optionStatus[0])) {
            return optionStatus.length > 0 && (optionStatus as [number, number][])
                .some(range => isInRange(range, status))
        } else {
            return isInRange(optionStatus as [number, number], status)
        }
    })

    return option ?? options.find(option => option.status == undefined)
}

// eslint-disable-next-line jsdoc/require-jsdoc
function createRetryOptions (
    status: number | null,
    retries: number,
    backoff?: RestRetriesBackoffOptions,
    statusIsInOptions?: boolean,
): InternalRetryData {
    return {
        retries: isRetryable(status, statusIsInOptions) ? retries : 0,
        backoff: backoff ? createBackoff(backoff) : (() => 0),
    }
}

/**
 * Get the amount to retry the failed request
 * @param options the client options for retrying requests
 * @param status The response status. `null` if no response is associated
 * @returns the final retry options
 */
export function getRetryAmount (options: RestRetries, status: number | null): InternalRetryData {
    if (typeof options === 'number') {
        return createRetryOptions(status, options)
    }

    const option = getRetryOptions(Array.isArray(options) ? options : [options], status)
    if (!option) return createRetryOptions(status, 0)
    else return createRetryOptions(status, option.retries, option.backoff, option.status != undefined)
}
