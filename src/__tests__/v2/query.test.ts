import { describe, expect, test } from 'vitest'

import { buildQuery } from '../../v2'

describe('query options', () => {
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

    test('resource options', () => {
        expect(buildQuery.campaigns()(undefined, {
            useDefaultIncludes: false,
        }).query).toEqual('?' + new URLSearchParams({ 'json-api-use-default-includes': 'false' }).toString())
    })
})
