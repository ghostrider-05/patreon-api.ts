/* eslint-disable @typescript-eslint/ban-types */
import { assertType, describe, test } from 'vitest'

import { Type, buildQuery } from '../../v2'

describe('campaign payload', () => {
    test('single', () => {
        assertType<{
            links: { self: string }
            data: { type: Type.Campaign, id: string, attributes: {} }
        }>(buildQuery.campaign()()._payload_type)
    })

    test('campaign with benefits', () => {
        assertType<{
            links: { self: string }
            data: { type: Type.Campaign, id: string, attributes: {} }
            included: (
                | { type: Type.Benefit, id: string, attributes: {} }
            )[]
                }>(buildQuery.campaign(['benefits'])()._payload_type)

        assertType<{
            links: { self: string }
            data: { type: Type.Campaign, id: string, attributes: {} }
            included: (
                | { type: Type.Benefit, id: string, attributes: {} }
            )[]
                }>(buildQuery.campaign(['benefits'])({ benefit: [] })._payload_type)

        assertType<{
            links: { self: string }
            data: { type: Type.Campaign, id: string, attributes: {} }
            included: (
                | { type: Type.Benefit, id: string, attributes: { benefit_type: string | null } }
            )[]
                }>(buildQuery.campaign(['benefits'])({ benefit: ['benefit_type'] })._payload_type)
    })

    test('campaign with creator', () => {
        assertType<{
            links: { self: string },
            data: { type: Type.Campaign, id: string, attributes: {} }
        }>(buildQuery.campaign(['creator'])()._payload_type)
    })

    test('campaign with goals', () => {
        assertType<{
            links: { self: string }
            data: { type: Type.Campaign, id: string, attributes: {} }
        }>(buildQuery.campaign(['goals'])()._payload_type)
    })

    test('campaign with tiers', () => {
        assertType<{
            links: { self: string }
            data: { type: Type.Campaign, id: string, attributes: {} }
        }>(buildQuery.campaign(['tiers'])()._payload_type)
    })
})

describe('campaigns payload', () => {
    test('list', () => {
        assertType<{
            meta: { pagination: { total: number, cursors?: { next: string } } }
            data: { type: Type.Campaign, id: string, attributes: {} }[]
        }>(buildQuery.campaigns()()._payload_type)
    })
})