/* eslint-disable @typescript-eslint/ban-types */
import { assertType, describe, test } from 'vitest'

import { Type, buildQuery } from '../v2'

describe('campaign payload', () => {
    test('single', () => {
        assertType<{
            links: { self: string },
            data: { type: Type.Campaign, id: string, attributes: {} }
        }>(buildQuery.campaign()()._payload_type)
    })
})

describe('campaigns payload', () => {
    test('list', () => {
        assertType<{
            meta: { pagination: { total: number, cursors?: { next: string } } },
            data: { type: Type.Campaign, id: string, attributes: {} }[]
        }>(buildQuery.campaigns()()._payload_type)
    })
})