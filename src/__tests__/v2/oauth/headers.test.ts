import { describe, expect, test } from 'vitest'

import {
    resolveHeaders,
    makeUserAgentHeader,
} from '../../../rest/v2/oauth2/rest/headers'

describe('rest headers', () => {
    test('user agent', () => {
        expect(makeUserAgentHeader('client', 'something')).toBeTypeOf('string')
        expect(makeUserAgentHeader('client')).toBeTypeOf('string')
    })

    test('parse headers', () => {
        expect(resolveHeaders({ 'User-Agent': 'My Header' })).toEqual({ 'User-Agent': 'my header' })
        expect(resolveHeaders(new Headers({ 'User-Agent': 'My Header' }))).toEqual({ 'user-agent': 'my header' })
    })
})
