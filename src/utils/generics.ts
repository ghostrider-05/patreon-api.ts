type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
    ? R
    : _TupleOf<T, N, [T, ...R]>;

/**
 * Tuple of T repeated N times
 */
export type Tuple<T, N extends number> = N extends N
    ? number extends N
        ? T[]
        : _TupleOf<T, N, []>
    : never;

export type Length<T extends unknown[] | string> =
    T extends { length: infer L } ? L extends number ? L : 0 : 0;

type Expand<T extends unknown[], N extends number> = Length<[
    ...Tuple<T, N>,
    ...T
]>;

export type Subtract<A extends number, B extends number> =
    Tuple<unknown, A> extends [...(infer U), ...Tuple<unknown, B>]
        ? Length<U>
        : never;

export type Add<T extends number, N extends number = 0> = Expand<
    Tuple<number, T>,
    N
>;