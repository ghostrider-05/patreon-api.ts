import { assertType, describe, test } from 'vitest'

import { AdditionalKeys } from '../../utils/fields'

describe('additional keys', () => {
    test('include all keys', () => {
        assertType<AdditionalKeys<'test', { test: string[] }>>({
            test: []
        })

        assertType<AdditionalKeys<'test' | 'another_test', { test: string[], another_test: string[] }>>({
            test: [],
            another_test: []
        })

        assertType<AdditionalKeys<'test', { test: string[], another_test: string[] }>>({
            test: [],
            another_test: []
        })

        assertType<AdditionalKeys<string, { test: string[], another_test: string[] }>>({
            test: [],
            another_test: []
        })
    })

    test('omit keys', () => {
        assertType<AdditionalKeys<never, { test: string[], another_test: string[] }>>(0)
    })
})
