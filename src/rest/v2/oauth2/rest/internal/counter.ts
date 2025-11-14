export interface RestRequestCounter {
    limit: number
    period: number
    count: number

    limited: boolean
    clear(): void
}

type RequestFilter = (url: string, init: { status: number, method: string }) => boolean

export type RestRequestCounterOptions =
    | number
    | {
        amount: number
        interval: number
        filter?: RequestFilter
        getStartCount?: () => number
        onRequest?: (counter: RestRequestCounter) => void
        onTimerEnd?: (counter: RestRequestCounter) => void
    }

// eslint-disable-next-line jsdoc/require-jsdoc
export async function sleep (ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export class RequestCounter implements RestRequestCounter {
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
        options: RestRequestCounterOptions,
        filter: RequestFilter,
    ) {
        if (typeof options === 'number') {
            this.period = 1000 // 1 second
            this.limit = options
            this.filter = filter
        } else {
            // Validate that the period is at least 1ms
            this.period = Math.max(options.interval, 0.001) * 1000 // convert seconds to ms
            this.limit = options.amount
            this.filter = options.filter ?? filter

            this._count = options.getStartCount?.() ?? null
            this.hooks = {
                onRequest: options.onRequest,
                onTimerEnd: options.onTimerEnd,
            }
        }
    }

    public add (): void {
        if (this.limit <= 0) return

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
    }

    public async wait (): Promise<void> {
        if (this._count != null && this._count > this.limit) {
            await sleep(this.period)
        }
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
