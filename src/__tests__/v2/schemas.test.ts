import { describe, expectTypeOf, test } from 'vitest'

// TODO: create tests for types not included
import {
    Type,
    type AttributeItem,
    type DataItem,
    type DataItems,
    // type GetResponsePayload,
    type Item,
    // type PatreonQuery,
    // type Relationship,
    type RelationshipFieldToFieldType,
    type RelationshipFields,
    // type RelationshipItem,
    // type RelationshipMainItemAttributes,
    type RelationshipMap,
    type RelationshipTypeFields
} from '../../v2'

import type { Tuple } from '../../utils/generics'

// TODO: update all `.branded.` checks after closing of https://github.com/mmkal/expect-type/issues/33

const empty: Record<string, never> = {}

/**
 * @param items the items to create a tuple type of
 * @returns a tupled type of `items`
 */
function createTuple <T extends string>(items: T[]): Tuple<T, typeof items['length']> {
    return items
}

describe('items', () => {
    const type: Type.Campaign = Type.Campaign
    const id: string = ''

    test('base item', () => {
        expectTypeOf({
            type,
            id,
        }).toEqualTypeOf<Item<Type.Campaign>>()
    })

    test('attribute item', () => {
        expectTypeOf({
            type,
            id,
            attributes: empty,
        }).toEqualTypeOf<AttributeItem<Type.Campaign>>()

        expectTypeOf({
            type,
            id,
            attributes: {
                count: 0,
            },
        }).toEqualTypeOf<AttributeItem<Type.Campaign, { count: number}>>()
    })

    test('data item', () => {
        expectTypeOf({
            data: {
                id,
                type,
            }
        }).toEqualTypeOf<DataItem<Type.Campaign>>()

        expectTypeOf({
            data: [{
                id,
                type,
            }]
        }).toEqualTypeOf<DataItems<Type.Campaign>>()

        expectTypeOf({
            data: {
                id,
                type,
            },
            links: {
                related: '',
            },
        }).branded.toEqualTypeOf<DataItem<Type.Campaign, true>>()
    })
})

describe('relationships', () => {
    test('relationship fields', () => {
        expectTypeOf(createTuple([
            'benefits',
            'creator',
            'goals',
            'tiers',
        ])).toEqualTypeOf<RelationshipFields<Type.Campaign>[]>()
    })

    test('relationship fields resource type', () => {
        expectTypeOf(<Type.Benefit>Type.Benefit).toEqualTypeOf<RelationshipFieldToFieldType<Type.Campaign, 'benefits'>>()
        expectTypeOf(<Type.User>Type.User).toEqualTypeOf<RelationshipFieldToFieldType<Type.Campaign, 'creator'>>()

        expectTypeOf(<Type.Campaign>Type.Campaign).toEqualTypeOf<RelationshipFieldToFieldType<Type.Tier, 'campaign'>>()
    })

    test('relationship fields to types', () => {
        expectTypeOf(createTuple([
            Type.Benefit,
            Type.Goal,
            Type.Tier,
            Type.User,
        ])).toEqualTypeOf<RelationshipTypeFields<Type.Campaign>[]>()

        expectTypeOf(createTuple([
            Type.Benefit,
            Type.Campaign,
            Type.Media,
        ])).toEqualTypeOf<RelationshipTypeFields<Type.Tier>[]>()
    })

    test('relationship map', () => {
        type CampaignMap = Required<RelationshipMap<`${Type.Campaign}`, 'tiers'>>

        expectTypeOf({
            tier: createTuple<CampaignMap['tier'][number]>(['amount_cents', 'title']),
            campaign: createTuple<CampaignMap['campaign'][number]>(['created_at', 'patron_count']),
        }).toEqualTypeOf<CampaignMap>()
    })
})
