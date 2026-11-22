import { type PatreonHeadersData } from './headers'

export interface PatreonErrorData {
    id: string
    code_challenge: null
    code: number | null
    code_name: string
    detail: string
    status: string
    title: string
    retry_after_seconds?: number
    source?: {
        parameter?: string
    }
}

export class PatreonError extends Error {
    public constructor (
        public error: PatreonErrorData,
        public data: PatreonHeadersData,
    ) {
        super(error.title + (error.detail ? ': ' + error.detail : ''))
    }

    public get retry_after_seconds () {
        return this.error.retry_after_seconds ?? 0
    }

    public override get name () {
        if (this.error.code && this.error.code_name) {
            return `PatreonError[${this.error.code_name}(${this.error.code})]`
        } else return 'PatreonError'
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function isValidErrorBody (body: unknown): body is { errors: PatreonErrorData[] } {
    return !!body && typeof body === 'object' && 'errors' in body && Array.isArray(body.errors)
}
