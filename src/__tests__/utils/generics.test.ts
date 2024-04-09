import { assertType, describe, expectTypeOf, test } from 'vitest'

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

describe('length', () => {
    test('array', () => {
        assertType<Length<[0, 1, 2]>>(3)
    })

    test('string', () => {
        assertType<Length<'test'>>(4)
    })
})

describe('subtract', () => {
    test('two numbers', () => {
        assertType<Subtract<9, 6>>(3)
    })

    test('no changes', () => {
        assertType<Subtract<9, 0>>(9)
        assertType<Subtract<1, 0>>(1)
        assertType<Subtract<0, 0>>(0)
    })
})

describe('tuple', () => {
    test('array', () => {
        assertType<Tuple<0, 2>>([0, 0])
    })

    test('one length', () => {
        assertType<Tuple<'test', 1>>(['test'])
    })

    test('empty', () => {
        assertType<Tuple<'test', 0>>([])
    })
})
