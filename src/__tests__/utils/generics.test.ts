import { assertType, describe, expectTypeOf, test } from 'vitest'

// TODO: add tests for more types
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Add, If, Length, Subtract, Tuple } from '../../utils/generics'

describe('add type', () => {
    test('add zero', () => {
        expectTypeOf<Add<9>>().toMatchTypeOf<9>()
        assertType<Add<9>>(9)

        assertType<Add<12>>(12)
    })

    test('add', () => {
        assertType<Add<9, 3>>(12)
        assertType<Add<12, 3>>(15)
    })
})

describe('if type', () => {
    test('generic boolean', () => {
        assertType<If<boolean, true, false>>(true)

        assertType<If<boolean, number, string>>(9)
        assertType<If<boolean, number, string>>('test')
    })

    test('true boolean', () => {
        assertType<If<true, true, false>>(true)
        assertType<If<true, string, number>>('test')
    })

    test('false boolean', () => {
        assertType<If<false, true, false>>(false)
        assertType<If<false, true>>(<never>{})
        assertType<If<false, string, number>>(9)
    })
})
