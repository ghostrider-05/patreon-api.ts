/* eslint-disable @typescript-eslint/no-empty-object-type */
import { assertType, describe, expect, expectTypeOf, test } from 'vitest'

import {
    Type,
    QueryBuilder,
    isListingNormalizedPayload,
    isListingPayload,
    normalize,
    normalizeFromQuery,
    simplify,
    simplifyFromQuery,
    type PatreonQuery,
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
        }>(QueryBuilder.campaign.build()()._payload_type)
    })

    test('campaign with benefits', () => {
        assertType<{
            links: { self: string }
            data: { type: Type.Campaign, id: string, attributes: {} }
            included: (
                | { type: Type.Benefit, id: string, attributes: {} }
            )[]
                }>(QueryBuilder.campaign.build(['benefits'])()._payload_type)

        assertType<{
            links: { self: string }
            data: { type: Type.Campaign, id: string, attributes: {} }
            included: (
                | { type: Type.Benefit, id: string, attributes: {} }
            )[]
                }>(QueryBuilder.campaign.build(['benefits'])({ benefit: [] })._payload_type)

        assertType<{
            links: { self: string }
            data: { type: Type.Campaign, id: string, attributes: {} }
            included: (
                | { type: Type.Benefit, id: string, attributes: { benefit_type: string | null } }
            )[]
                }>(QueryBuilder.campaign.build(['benefits'])({ benefit: ['benefit_type'] })._payload_type)
    })

    test('campaign with creator', () => {
        assertType<{
            links: { self: string },
            data: { type: Type.Campaign, id: string, attributes: {} }
        }>(QueryBuilder.campaign.build(['creator'])()._payload_type)
    })

    test('campaign with goals', () => {
        assertType<{
            links: { self: string }
            data: { type: Type.Campaign, id: string, attributes: {} }
        }>(QueryBuilder.campaign.build(['goals'])()._payload_type)
    })

    test('campaign with tiers', () => {
        assertType<{
            links: { self: string }
            data: { type: Type.Campaign, id: string, attributes: {} }
        }>(QueryBuilder.campaign.build(['tiers'])()._payload_type)
    })
})

describe('campaigns payload', () => {
    test('list', () => {
        assertType<{
            meta: { pagination: { total: number, cursors?: { next: string | null } } }
            data: { type: Type.Campaign, id: string, attributes: {} }[]
        }>(QueryBuilder.campaigns.build()()._payload_type)
    })
})

describe('to camel case', () => {
    test('objects', () => {
        expect(convertToCamelcase({})).toEqual({})
        expect(convertToCamelcase({ test: 1 })).toEqual({ test: 1 })

        expect(convertToCamelcase({ trailing_: 'invalid' })).toEqual({ trailing_: 'invalid' })
    })

    test('keys', () => {
        expect(convertToCamelcase({
            type: 'member',
            id: 'me',
            currently_entitled_tiers: [],
            pledge_history: [
                {
                    type: 'pledge-event',
                    id: '0',
                    pledge_payment_status: 'valid',
                }
            ],
        })).toStrictEqual({
            type: 'member',
            id: 'me',
            currentlyEntitledTiers: [],
            pledgeHistory: [
                {
                    type: 'pledge-event',
                    id: '0',
                    pledgePaymentStatus: 'valid',
                }
            ]
        })
    })
})

describe('listing payloads', () => {
    test('default API', () => {
        expect(isListingPayload({
            data: [],
            meta: {
                pagination: {
                    total: 0,
                    cursors: { next: null },
                },
            },
        })).toEqual(true)

        expect(isListingPayload({
            data: {
                attributes: {},
                type: Type.Campaign,
                id: 'jhdhodw',
            },
            links: {
                self: 'some url',
            },
        })).toEqual(false)
    })

    test('normalized API', () => {
        expect(isListingNormalizedPayload({
            data: [],
            pagination: {
                total: 0,
                next_cursor: null,
            }
        })).toEqual(true)

        expect(isListingNormalizedPayload({
            id: 'id',
            type: Type.Campaign,
            benefits: [],
            creator: {
                id: 'creator',
                type: Type.User,
            },
            goals: [],
            tiers: [],
            link: 'api_url',
        })).toEqual(false)
    })
})

describe('normalize', () => {
    test('from query', () => {
        const data = {
            data: {
                id: 'hdhow',
                type: <const>Type.Campaign,
                attributes: {
                    discord_server_id: null,
                }, 
            },
            links: { self: 'some url' },
        }

        expect(normalize(data)).toEqual(normalizeFromQuery(data))
    })

    test('single resource', () => {
        expect(normalize({
            data: {
                id: 'hdhow',
                type: <const>Type.Campaign,
                attributes: {
                    discord_server_id: null,
                }, 
            },
            links: { self: 'some url' },
        })).toEqual({
            id: 'hdhow',
            type: Type.Campaign,
            discord_server_id: null,
            link: 'some url',
        })

        expect(normalize({
            data: {
                id: 'hdhow',
                type: <const>Type.Campaign,
                attributes: {
                    discord_server_id: null,
                },
                relationships: {
                    creator: {
                        data: {
                            type: Type.User,
                            id: 'creator',
                        }
                    },
                    tiers: {
                        data: [],
                    },
                    address: {
                        data: null,
                    },
                }
            },
            links: { self: 'some url' },
            included: [
                {
                    type: Type.User,
                    id: 'creator',
                    attributes: {
                        full_name: 'ghostrider-05',
                    }
                }
            ]
        })).toEqual({
            id: 'hdhow',
            type: Type.Campaign,
            discord_server_id: null,
            link: 'some url',
            address: null,
            creator: {
                type: Type.User,
                id: 'creator',
                full_name: 'ghostrider-05',
            },
            tiers: [],
        })
    })

    test('list resource', () => {
        expect(normalize({
            data: [
                {
                    type: Type.Campaign,
                    id: 'campaign',
                    attributes: {
                        patron_count: 12,
                    },
                }
            ],
            included: [],
            meta: {
                pagination: {
                    total: 1,
                    cursors: { next: null },
                }
            }
        })).toEqual({
            data: [
                {
                    type: 'campaign',
                    id: 'campaign',
                    patron_count: 12,
                }
            ],
            pagination: {
                next_cursor: null,
                total: 1,
            },
        })
    })

    test('invalid included items', () => {
        expect(() => normalize({
            data: {
                type: <const>Type.Campaign,
                id: 'campaign',
                attributes: {},
                relationships: {
                    tiers: {
                        data: [
                            {
                                type: Type.Tier,
                                id: 'tier',
                            }
                        ]
                    }
                }
            },
            included: [],
            links: { self: '' },
        })).toThrowError()
    })
})

describe('simplify', () => {
    test('from query', () => {
        const data = {
            data: {
                id: 'hdhow',
                type: <const>Type.Campaign,
                attributes: {
                    discord_server_id: null,
                }, 
            },
            links: { self: 'some url' },
        }

        expect(simplify(data)).toEqual(simplifyFromQuery(data))
    })
})
