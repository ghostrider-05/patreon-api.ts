import { assert, describe, expect, test } from 'vitest'

import {
    createBackoff,
    getRetryAmount,
    defaultRetries,
} from '../../../rest/v2/oauth2/rest/retries'

describe('backoff', () => {
    test('linear strategy', () => {
        const backoff = createBackoff({
            strategy: 'linear',
            time: 1000,
        })

        expect(backoff(0)).toEqual(0)
        expect(backoff(1)).toEqual(1000)
        expect(backoff(2)).toEqual(2000)
        expect(backoff(3)).toEqual(3000)
    })

    test('exponential strategy', () => {
        const backoff = createBackoff({
            strategy: 'exponential',
            time: 1000,
        })

        expect(backoff(0)).toEqual(0)
        expect(backoff(1)).toEqual(1000)
        expect(backoff(2)).toEqual(4000)
        expect(backoff(3)).toEqual(9000)
    })

    test('custom strategy', () => {
        const backoff = createBackoff({
            strategy(retries, backoff) {
                return retries * backoff + backoff
            },
            time: 1000,
        })

        expect(backoff(0)).toEqual(1000)
        expect(backoff(1)).toEqual(2000)
        expect(backoff(2)).toEqual(3000)
        expect(backoff(3)).toEqual(4000)
    })

    test('limit time', () => {
        const backoff = createBackoff({
            strategy: 'exponential',
            time: 1000,
            limit: 5000,
        })

        expect(backoff(0)).toEqual(0)
        expect(backoff(1)).toEqual(1000)
        expect(backoff(2)).toEqual(4000)
        expect(backoff(3)).toEqual(5000)
    })

    test('with jitter', () => {
        const backoff = createBackoff({
            strategy: 'linear',
            time: 1000,
            jitter: 200,
        })

        assert(expect(backoff(0)).approximately(0, 200))
        assert(expect(backoff(1)).approximately(1000, 200))
        assert(expect(backoff(2)).approximately(2000, 200))
        assert(expect(backoff(3)).approximately(3000, 200))
    })
})

describe('retry amount', () => {
    test('default option', () => {
        expect(getRetryAmount(defaultRetries, null).backoff(0)).toEqual(0)
        expect(getRetryAmount(defaultRetries, null).retries).toEqual(3)
    })

    test('custom option', () => {
        const options = getRetryAmount({
            retries: 2,
            backoff: { strategy: 'linear', time: 1000 },
        }, null)

        expect(options.retries).toEqual(2)
        expect(options.backoff(1)).toEqual(1000)
    })

    test('status check', () => {
        expect(getRetryAmount(defaultRetries, 500).retries).toEqual(defaultRetries)
        expect(getRetryAmount(defaultRetries, 401).retries).toEqual(0)
    })

    test('custom status retries', () => {
        const get = (status: number | null) => getRetryAmount([
            { status: 200, retries: -1 },
            { status: [401, 403], retries: 4 },
        ], status).retries

        expect(get(null)).toEqual(defaultRetries)
        expect(get(200)).toEqual(-1)
        expect(get(402)).toEqual(4)
        expect(get(503)).toEqual(defaultRetries)
    })
})
