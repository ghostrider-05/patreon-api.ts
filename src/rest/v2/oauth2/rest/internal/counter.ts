export interface RestRequestCounter {
    limit: number
    period: number
    count: number

    limited: boolean
    clear(): void
}

export type RestRequestCounterOptions =
    | number
    | { amount: number, interval: number }

// eslint-disable-next-line jsdoc/require-jsdoc
export async function sleep (ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export class RequestCounter implements RestRequestCounter {
    public period: number
    public limit: number

    private _count: number | null = null
    private timer: NodeJS.Timeout | undefined = undefined

    public constructor (
        options: RestRequestCounterOptions,
    ) {
        if (typeof options === 'number') {
            this.period = 1000 // 1 second
            this.limit = options
        } else {
            this.period = options.interval * 1000 // convert seconds to ms
            this.limit = options.amount
        }
    }

    public add (): void {
        if (this.limit <= 0) return

        if (this._count != null) {
            this._count += 1
        } else {
            this._count = 1
            this.timer = setInterval(() => {
                this._count = 0
            }, this.period).unref()
        }
    }

    public async wait (): Promise<void> {
        if (this._count != null && this._count > this.limit) {
            await sleep(this.period)
        }
    }

    public clear (): void {
        clearInterval(this.timer)
    }

    public get count(): number {
        return this._count ?? 0
    }

    public get limited (): boolean {
        return this._count != null && this._count > this.limit
    }
}
