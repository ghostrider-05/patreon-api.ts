import type { Add, Length, Subtract } from './generics'

type ComputeRange<
    N extends number,
    Result extends Array<unknown> = [],
    I extends number = 1
> = Result['length'] extends Add<N, I>
    ? Result
    : ComputeRange<N, [...Result, Result['length']]>;

/**
 * Type for a number array holding the values 0 ... M
 */
type IncreasingArray<M extends number> = ComputeRange<M, []>;

/**
 * From https://github.com/microsoft/TypeScript/issues/13298#issuecomment-885980381
 */

type UnionToIntersection<U> = (
    U extends never ? never : (arg: U) => never
) extends (arg: infer I) => void
    ? I
    : never;

type UnionToTuple<T> = UnionToIntersection<
    T extends never ? never : (t: T) => T
> extends (_: never) => infer W
    ? [...UnionToTuple<Exclude<T, W>>, W]
    : [];

type Additional<I extends string, C, E, O> = Subtract<
    Length<IncreasingArray<Length<UnionToTuple<I>>>>,
    1
> extends C ? E : O;

/**
 * Returns ToAdd if Filter is a string.
 * If ToAdd is never, it returns unknown.
 */
export type AdditionalKeys<
    Filter extends string,
    ToAdd extends Record<string, unknown>
> = Additional<
    Filter,
    0,
    unknown,
    ToAdd
>;

/**
 * Returns the types based on the logic:\
 * if T:\
 *      return A\
 * else:\
 *      return B
 */
export type If<T extends boolean, A, B = never> = T extends true ? A : B;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CustomTypeOptions {}

export type CustomTypeOption<Key extends string, Value> = CustomTypeOptions extends { [K in Key]: unknown }
    ? CustomTypeOptions[Key]
    : Value

type LastOf<T> =
  UnionToIntersection<T extends unknown ? () => T : never> extends () => (infer R) ? R : never

type Push<T extends unknown[], V> = [...T, V];

type TuplifyUnion<T, L = LastOf<T>, N = [T] extends [never] ? true : false> =
    true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>

export type ObjValueTuple<T, KS extends unknown[] = TuplifyUnion<keyof T>, R extends unknown[] = []> =
    KS extends [infer K, ...infer KT]
        ? ObjValueTuple<T, KT, [...R, T[K & keyof T]]>
        : R
