/* eslint-disable @typescript-eslint/no-empty-object-type */
import { assertType, describe, expect, expectTypeOf, test } from 'vitest'

import {
    Type,
    buildQuery,
    type PatreonQuery
} from '../../v2'

import { convertToCamelcase } from '../../payloads/v2/normalized/capitalize'

// TODO: add all queries
describe('campaign payload', () => {
    test('single', () => {
        expectTypeOf<{
            links: { self: string }
            data: { type: Type.Campaign, id: string, attributes: {} }
        }>().toEqualTypeOf<PatreonQuery<Type.Campaign, never, never>['_payload_type']>()

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
            meta: { pagination: { total: number, cursors?: { next: string | null } } }
            data: { type: Type.Campaign, id: string, attributes: {} }[]
        }>(buildQuery.campaigns()()._payload_type)
    })
})

describe('to camel case', () => {
    test('objects', () => {
        expect(convertToCamelcase({})).toEqual({})
        expect(convertToCamelcase({ test: 1 })).toEqual({ test: 1 })
    })
})
