import { describe, expect, test } from 'vitest'

import { PatreonError } from '../../../rest/v2/oauth2/rest/error'

describe('error class', () => {
    test('custom attributes', () => {
        const error = new PatreonError(<never>{
            code: 0,
            code_name: 'Test',
            title: 'Error',
            retry_after_seconds: 2,
        }, <never>{})

        expect(error.message).toEqual('Error')
        expect(error.retry_after_seconds).toEqual(2)
        expect(error.name).toBeTypeOf('string')

        const error2 = new PatreonError(<never>{
            code: null,
            code_name: 'Test',
            title: 'Error',
        }, <never>{})

        expect(error2.message).toEqual('Error')
        expect(error2.retry_after_seconds).toEqual(0)
        expect(error2.name).toBeTypeOf('string')
    })
})
