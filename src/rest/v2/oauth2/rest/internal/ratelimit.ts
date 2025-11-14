import { sleep } from './counter'

const parseToInt = (input: string | number) => typeof input === 'string' ? parseInt(input) : input

export class RatelimitManager {
    private limitedUntil: Date | null = null

    public get limited () {
        return this.limitedUntil != null
    }

    public clear (): void {
        this.limitedUntil = null
    }

    public async wait (): Promise<number> {
        if (this.limitedUntil == null) return 0

        const offset = Date.now() - this.limitedUntil.getTime()

        await sleep(offset)
        this.clear()

        return offset
    }

    public applyTimeout (
        response: number | string | undefined,
        timeout: number,
    ) {
        const retryTimeout = (parseToInt(response ?? 0) * 1000) + timeout

        if (retryTimeout > 0) {
            this.limitedUntil = new Date(Date.now() + retryTimeout)
        }
    }
}
