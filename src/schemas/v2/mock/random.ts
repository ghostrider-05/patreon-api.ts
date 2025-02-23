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
