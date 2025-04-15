/* eslint-disable @typescript-eslint/no-empty-object-type */
import { describe, expect, expectTypeOf, test } from 'vitest'

import { buildQuery, QueryBuilder, RelationshipFields, RelationshipMap, Type } from '../../v2'

describe('old query options', () => {
    test('pagination options', () => {
        expect(buildQuery.campaigns()(undefined, {
            count: 100,
            sort: 'created'
        }).query).toEqual('?' + new URLSearchParams({ 'page[count]': '100', sort: 'created' }).toString())

        expect(buildQuery.campaigns()(undefined, {
            count: 100,
            sort: ['created'],
        }).query).toEqual('?' + new URLSearchParams({ 'page[count]': '100', sort: 'created' }).toString())

        expect(buildQuery.campaigns()(undefined, {
            count: 100,
            sort: { key: 'created' },
        }).query).toEqual('?' + new URLSearchParams({ 'page[count]': '100', sort: 'created' }).toString())

        expect(buildQuery.campaigns()(undefined, {
            count: 100,
            sort: { key: 'created', descending: true },
        }).query).toEqual('?' + new URLSearchParams({ 'page[count]': '100', sort: '-created' }).toString())

        expect(buildQuery.campaigns()(undefined, {
            count: 100,
            cursor: 'cursor',
            sort: { key: 'created', descending: true },
        }).query).toEqual('?' + new URLSearchParams({ 'page[count]': '100', 'page[cursor]': 'cursor', sort: '-created' }).toString())
    })

    // test('resource options', () => {
    // })
})

describe('query builder', () => {
    test('from params', () => {
        const params = new URLSearchParams({ include: 'creator' })

        expect(QueryBuilder.fromParams(params)._payload_type).toEqual('')
        expect(QueryBuilder.fromParams(params).params).toEqual(params)
        expect(QueryBuilder.fromParams(params).query).toEqual('?' + params.toString())
    })

    test('convert type to name', () => {
        expect(QueryBuilder.convertTypeToRelation('campaign', Type.Tier)).toEqual('tiers')
        expect(QueryBuilder.convertTypeToRelation('member', Type.PledgeEvent)).toEqual('pledge_history')
        expect(QueryBuilder.convertTypeToRelation('campaign', Type.User)).toEqual('creator')
        expect(QueryBuilder.convertTypeToRelation('member', Type.User)).toEqual('user')
        expect(QueryBuilder.convertTypeToRelation('user', Type.Member)).toEqual('memberships')
    })

    test('convert name to type', () => {
        expect(QueryBuilder.convertRelationToType('campaign', 'creator')).toEqual(Type.User)
        expect(QueryBuilder.convertRelationToType('campaign', 'tiers')).toEqual(Type.Tier)
        expect(QueryBuilder.convertRelationToType('member', 'currently_entitled_tiers')).toEqual(Type.Tier)
        expect(QueryBuilder.convertRelationToType('member', 'address')).toEqual(Type.Address)
        expect(QueryBuilder.convertRelationToType('user', 'memberships')).toEqual(Type.Member)
    })

    test('complete options', () => {
        const options = QueryBuilder.createCompleteOptions(Type.Campaign)

        expect(options.include).toEqual(['benefits', 'creator', 'goals', 'tiers'])
        expect(Object.keys(options.attributes)).toEqual(['campaign', 'benefit', 'user', 'goal', 'tier'])

        for (const attributes of Object.values(options.attributes)) {
            expect(Array.isArray(attributes)).toEqual(true)
            expect(attributes.every(key => typeof key === 'string')).toEqual(true)
        }
    })

    test('empty query', () => {
        expect(QueryBuilder.campaign.relationships).toEqual([])
        expect(QueryBuilder.campaign.attributes).toEqual({})
    })

    test('query with one relationship', () => {
        expect(QueryBuilder.campaign.addRelationships(['creator']).relationships).toEqual(['creator'])
        expect(QueryBuilder.campaign.setRelationships(['tiers']).relationships).toEqual(['tiers'])
        expect(
            QueryBuilder.campaign
                .setRelationships(['goals'])
                .setRelationships(['tiers'])
                .relationships
        ).toEqual(['tiers'])

        expectTypeOf<
            QueryBuilder<Type.Campaign, false, 'tiers', {}>
        >().toEqualTypeOf(QueryBuilder.campaign.addRelationships(['tiers']))

        expectTypeOf<
            QueryBuilder<Type.Campaign, false, 'creator', {}>
        >().toEqualTypeOf(QueryBuilder.campaign.setRelationships(['creator']))

        expectTypeOf<
            QueryBuilder<Type.Campaign, false, 'creator', {}>
        >().toEqualTypeOf(
            QueryBuilder.campaign
                .setRelationships(['tiers'])
                .setRelationships(['creator'])
        )

        expect(QueryBuilder.campaign.setRelationships(['creator']).attributesFor('creator')).toBeUndefined()
    })

    test('query with all relationships', () => {
        expect(QueryBuilder.campaign.includeAllRelationships().relationships).toEqual([
            'benefits',
            'creator',
            'goals',
            'tiers'
        ])

        expectTypeOf<
            QueryBuilder<Type.Campaign, false, 'benefits' | 'goals' | 'creator' | 'tiers', {}>
        >().toEqualTypeOf(QueryBuilder.campaign.includeAllRelationships())
    })

    test('query with relationship and attributes', () => {
        const query = QueryBuilder.campaign.addRelationshipAttributes('creator', ['full_name'])

        expect(query.relationships).toEqual(['creator'])
        expect(query.attributes).toEqual({ user: ['full_name'] })
        expect(query.attributesFor('creator')).toEqual(['full_name'])

        expectTypeOf<
            QueryBuilder<Type.Campaign, false, 'creator', { user: 'full_name'[] }>
        >().toEqualTypeOf(query)

        const queryWithPledgesAttributes = query.addRelationshipAttributes('creator', ['hide_pledges']).attributes

        expect(queryWithPledgesAttributes).toEqual({
            user: ['full_name', 'hide_pledges'],
        })

        expectTypeOf<
            { user: ('full_name' | 'hide_pledges')[] } & { user: 'full_name'[] }
        >().toEqualTypeOf(queryWithPledgesAttributes)

        expect(query.addRelationshipAttributes('tiers', ['patron_count']).attributes).toEqual({
            user: ['full_name', 'hide_pledges'],
            tier: ['patron_count'],
        })

        expectTypeOf<
            QueryBuilder<Type.Campaign, false, 'creator' | 'tiers', { user: ('full_name')[] } & { tier: ('patron_count')[] }>
        >().toEqualTypeOf(query.addRelationshipAttributes('tiers', ['patron_count']))
    })

    test('query with set relationship and attributes', () => {
        const query = QueryBuilder.campaign
            .setRelationshipAttributes('creator', ['hide_pledges'])
            .setRelationshipAttributes('creator', ['full_name'])

        expect(query.attributes).toEqual({ user: ['full_name'] })
        expect(query.relationships).toEqual(['creator'])

        expectTypeOf<
            QueryBuilder<Type.Campaign, false, 'creator', { user: 'full_name'[] }>
        >().toExtend<typeof query>()

        expectTypeOf<'full_name'[] | undefined>().toEqualTypeOf(query.attributesFor('creator'))
    })

    test('query with all included', () => {
        const query = QueryBuilder.campaign.includeAll()

        expect(query.relationships).toEqual([
            'benefits',
            'creator',
            'goals',
            'tiers',
        ])

        expectTypeOf<
            QueryBuilder<Type.Campaign, false,
                RelationshipFields<Type.Campaign>,
                Required<RelationshipMap<Type.Campaign, RelationshipFields<Type.Campaign>>>
            >
        >().toEqualTypeOf(query)
    })

    test('invalid resource', () => {
        expect(() => QueryBuilder.createRelationMap(<never>'invalid')).toThrowError()
        expect(() => QueryBuilder.campaign.attributesFor(<never>'invalid')).toThrowError()
        expect(() => QueryBuilder.convertTypeToRelation('campaign', <never>'invalid')).toThrowError()
    })
})
