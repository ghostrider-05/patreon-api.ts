import { describe, expect, test } from 'vitest'

import { buildQuery, QueryBuilder, Type } from '../../v2'

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
    })
})
