import { type ItemMap, type ItemType } from '../item'

import { QueryBuilder } from '../query'

import type {
    Relationship,
    RelationshipData,
    RelationshipFields,
    RelationshipFieldToFieldType,
} from '../relationships'

export type {
    CacheStoreBinding,
} from './bindings/types'

import type { ObjValueTuple } from '../../../utils/fields'

export interface CacheStoreConvertOptions<
    O extends Record<string, unknown> = Record<string, unknown>
> {
    toKey (...args: ObjValueTuple<O>): string
    fromKey (key: string): O
    toKeyFromObject (key: O): string
}

type StringifiedRelationships<T extends ItemType, F extends RelationshipFields<T> = RelationshipFields<T>> = {
    [R in keyof Relationship<T, F>['relationships']]?: (
        Relationship<T, F>['relationships'][R]['data'] extends infer K
            ? NonNullable<K> extends unknown[]
                ? string[]
                : string
            : never
    ) | null
}

export type CacheItem<T extends ItemType> = {
    item: Partial<ItemMap[T]>
    relationships: StringifiedRelationships<T>
}

export const RelationshipsUtils = {
    stringify <
        T extends ItemType,
        F extends RelationshipFields<T>
    >(relationships: Relationship<T, F>['relationships']): StringifiedRelationships<T, F> {
        return Object.entries<Relationship<T, F>['relationships']>(relationships).reduce((output, [key, value]) => {
            const data = value['data'] as RelationshipData<T, F>

            return {
                ...output,
                [key]: data == null ? null : (Array.isArray(data) ? data.map(d => d.id) : data.id)
            }
        }, {})
    },
    parse<
        T extends ItemType,
        F extends RelationshipFields<T>,
    > (
        type: T,
        relationships: StringifiedRelationships<T, F>,
    ): Relationship<T, F> & {
            fields: RelationshipFields<T>[]
            map: { [R in RelationshipFields<T>]: RelationshipFieldToFieldType<T, R> }
        } {
        const relationFields = Object.keys(relationships) as F[]
        const relationMap = QueryBuilder.createRelationMap(type)

        return {
            fields: Object.keys(relationMap) as F[],
            map: relationMap,
            relationships: relationFields.reduce<Relationship<T, F>['relationships']>((obj, key) => {
                const ids = relationships[key]
                return {
                    ...obj,
                    [key]: ids == null ? { data: null } : (Array.isArray(ids)
                        ? { data: ids.map(id => ({ id, type: relationMap[key] })) }
                        : { data: { id: ids, type: relationMap[key] }, links: { related: '' } })
                }
            }, {} as never)
        }
    },
}
