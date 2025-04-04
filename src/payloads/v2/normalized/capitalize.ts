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
 * Convert a string to camel case
 * @param key the input string (likely snake_case)
 * @returns the camelCase string
 */
function toCamelcase <T extends string>(key: T): CamelCase<T> {
    if (!key.includes('_')) return key as unknown as CamelCase<T>
    const [first, ...otherParts] = key.split('_').filter(n => n.length > 0)
    const second = otherParts.join('_')
    if (otherParts.length === 0) return key as unknown as CamelCase<T>

    const combined = first + second.charAt(0).toUpperCase() + second?.slice(1)

    return toCamelcase(combined) as CamelCase<T>
}

/**
 * Convert an object keys to camel case
 * @param item the input item with keys (likely snake_case)
 * @returns the object with camelCase string keys
 */
export function convertToCamelcase <T> (item: T): AnyToCamelCase<T>{
    if (Array.isArray(item)) return <never>item.map(child => convertToCamelcase(child))
    else if (typeof item === 'object' && item != null) {
        return <never>Object.keys(item).reduce((obj, key) => ({
            ...obj,
            [toCamelcase(key)]: convertToCamelcase(item[key]),
        }), {} as KeysToCamelCase<T>)
    } else {
        return <never>item
    }
}
