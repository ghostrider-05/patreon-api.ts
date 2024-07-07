/* eslint-disable @typescript-eslint/ban-types */

type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
    : Lowercase<S>

type KeysToCamelCase<T> = {
    [K in keyof T as CamelCase<string & K>]: T[K]
}

export type AnyToCamelCase<T> = T extends (infer A)[]
    ? AnyToCamelCase<A>[]
    : T extends object
        ? { [K in keyof T as CamelCase<string & K>]: AnyToCamelCase<T[K]> }
        : T

/**
 *
 * @param obj
 * @param key
 */
function toCamelcase <T extends string>(key: T): CamelCase<T> {
    if (!key.includes('_')) return key as unknown as CamelCase<T>
    const [first, second] = key.split('_', 2)
    const combined = first.toLowerCase() + second.charAt(0).toUpperCase() + second.slice(1)

    return toCamelcase(combined) as CamelCase<T>
}

/**
 *
 * @param item
 */
export function convertToCamelcase <T> (item: T): AnyToCamelCase<T>{
    if (Array.isArray(item)) return <never>item.map(convertToCamelcase)
    else if (typeof item === 'object' && item) {
        return <never>Object.keys(item).reduce((obj, key) => ({
            ...obj,
            [toCamelcase(key)]: convertToCamelcase(obj[key]),
        }), {} as KeysToCamelCase<T>)
    } else return <never>item
}