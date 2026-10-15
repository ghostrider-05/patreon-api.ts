interface Limiter {
    limited: boolean
    clear (): void
}

export interface RestRequestLimiter extends Limiter {
    wait (): Promise<number>
    add (time?: number): number
}

export interface RestRequestCounter extends Limiter {
    limit: number
    period: number
    count: number
    filter: RequestFilter
}

type RequestFilter = (url: string, init: { status: number, method: string }) => boolean

export type RestRequestCounterOptions =
    | number
    | (RestRequestCounter & RestRequestLimiter)
    | {
        /**
         * The period for this counter (in seconds).
         * Must be at least 1ms.
         */
        period: number
        limit: number
        filter?: RequestFilter
        getStartCount?: () => number | null
        onRequest?: (counter: RestRequestCounter) => void
        onTimerEnd?: (counter: RestRequestCounter) => void
    }

// eslint-disable-next-line jsdoc/require-jsdoc
export async function sleep (ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

// Validate that the period is at least 1ms
// eslint-disable-next-line jsdoc/require-jsdoc
function getPeriod (option: number): number {
    return Math.max(option, 0.001) * 1000 // convert seconds to ms
}

export class RequestCounter implements RestRequestCounter, RestRequestLimiter {
    public period: number
    public limit: number
    public filter: RequestFilter

    private _count: number | null = null
    private timer: NodeJS.Timeout | undefined = undefined
    private hooks: Partial<Record<
        | 'onRequest'
        | 'onTimerEnd',
        ((counter: RestRequestCounter) => void) | undefined
    >> = {}

    public constructor (
        options: Exclude<RestRequestCounterOptions, (RestRequestCounter & RestRequestLimiter)>,
        defaultFilter: RequestFilter = (() => true),
    ) {
        if (typeof options === 'number') {
            this.period = 1000 // 1 second
            this.limit = options
            this.filter = defaultFilter
        } else {
            this.period = getPeriod(options.period)
            this.limit = options.limit
            this.filter = options.filter ?? defaultFilter

            this._count = options.getStartCount?.() ?? null
            this.hooks = {
                onRequest: options.onRequest,
                onTimerEnd: options.onTimerEnd,
            }
        }
    }

    public static fromOptions (
        options: RestRequestCounterOptions,
        defaultFilter?: RequestFilter,
    ): (RestRequestCounter & RestRequestLimiter) {
        if (typeof options !== 'number' && 'wait' in options && 'add' in options && 'count' in options) {
            return options
        } else return new RequestCounter(options, defaultFilter)
    }

    public add (): number {
        if (this.limit <= 0) return 0

        if (this._count != null) {
            this._count += 1
        } else {
            this._count = 1
            this.timer = setInterval(() => {
                this.hooks.onTimerEnd?.(this)

                this._count = 0
            }, this.period).unref()
        }

        this.hooks.onRequest?.(this)
        return this._count
    }

    public async wait (): Promise<number> {
        if (this._count != null && this._count > this.limit) {
            await sleep(this.period)
        }

        return this.period
    }

    public clear (): void {
        clearInterval(this.timer)
    }

    public get count (): number {
        return this._count ?? 0
    }

    public get limited (): boolean {
        return this._count != null && this._count > this.limit
    }
}
