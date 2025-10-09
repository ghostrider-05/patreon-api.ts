export interface RandomDataGenerator {
    boolean: () => boolean
    number: () => number
    arrayElement: <T> (array: T[]) => T
    arrayElements: <T> (array: T[]) => T[]

    pastDate: () => string
    futureDate: () => string
    email: () => string
    uri: () => string
    imageUri: () => string
    videoUri: () => string

    fullName: () => string
    firstName: () => string
    lastName: () => string
    // address
    countryCode: () => string
    state: () => string
    city: () => string
    phonenumber: () => string
    // benefit
    title: () => string
    description: () => string
    // client
    username: () => string
    // pledge-event
    currencyCode: () => string
}

const _random = <T>(list: T[]): T => list[list.length * Math.random() | 0] as T
const _random_int = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

export type RandomInteger =
    | number
    | { min: number, max: number }

// internal function
export function resolveRandomInteger (
    int: RandomInteger,
): number
export function resolveRandomInteger (
    int: RandomInteger | undefined,
    items: unknown[] | undefined,
    defaultMaxValue: number,
): number
// eslint-disable-next-line jsdoc/require-jsdoc
export function resolveRandomInteger (
    int: RandomInteger | undefined,
    items: unknown[] | undefined = undefined,
    defaultMaxValue: number = 10,
): number {
    if (int == undefined) {
        return items != undefined && items.length > 0
            ? items.length
            : _random_int(1, defaultMaxValue)
    }

    if (typeof int === 'number') {
        return int
    }

    return _random_int(int.min, int.max)
}

export const defaultRandomDataGenerator: RandomDataGenerator = {
    arrayElement: _random,
    boolean: () => _random([true, false]),
    number: () => _random(Array.from({ length: 40 }, (_, i) => i)),
    countryCode: () => _random(['NL', 'BE', 'DE']),
    arrayElements(array) {
        return Array.from({ length: _random_int(1, array.length) }, () => _random(array))
    },
    city: () => 'Amsterdam',
    currencyCode: () => 'EUR',
    description: () => 'A mocked description',
    email: () => 'john.doe@gmail.com',
    firstName: () => 'John',
    fullName: () => 'John Doe',
    lastName: () => 'Doe',
    phonenumber: () => '+31612345678',
    state: () => '',
    username: () => 'john_doe',
    title: () => 'A mocked title',
    uri: () => 'https://patreon.com/',
    imageUri: () => 'https://patreon.com/',
    videoUri: () => 'https://patreon.com/',
    futureDate: () => new Date(Date.now() + _random_int(10_000, 100_000)).toISOString(),
    pastDate: () => new Date(Date.now() - _random_int(10_000, 100_000)).toISOString(),
}
