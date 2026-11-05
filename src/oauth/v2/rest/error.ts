import type { PatreonHeadersData } from './headers'

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
        super(error.title)
    }

    public get retry_after_seconds () {
        return this.error.retry_after_seconds ?? 0
    }

    public override get name () {
        return `${this.error.code_name}[${this.error.code ?? 'unknown code'}]`
    }
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function isValidErrorBody (body: unknown): body is { errors: PatreonErrorData[] } {
    return !!body && typeof body === 'object' && 'errors' in body && Array.isArray(body.errors)
}
