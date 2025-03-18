/* eslint-disable jsdoc/require-jsdoc */
import {
    QueryBuilder,
    type DataItem,
    type DataItems,
    type ItemType,
    type Relationship,
    type RelationshipFields,
    type RelationshipFieldToFieldType,
    type RelationshipItem,
    type RelationshipMap,
} from '../../../schemas/v2/'

import type { NormalizedRelationshipItem } from './payload'

type RelationshipData<
    T extends ItemType,
    F extends RelationshipFields<T>
> = (
    | DataItem<RelationshipFieldToFieldType<T, F>, true>
    | DataItems<RelationshipFieldToFieldType<T, F>, false>
    | { data: null }
)['data']

class NormalizedError extends Error {
    public constructor (message: string) {
        super('[Normalized] ' + message)
    }
}

function getTypeForIncludeKey <Type extends ItemType, Field extends RelationshipFields<Type>>(type: Type, includeKey: Field): RelationshipFieldToFieldType<Type, Field> {
    const resourceKey = QueryBuilder.convertRelationToType(type, includeKey)
    if (resourceKey == undefined) throw new NormalizedError(`No resource key found for ${includeKey} on ${type}`)

    return resourceKey as RelationshipFieldToFieldType<Type, Field>
}

function findRelation <
    Type extends ItemType,
    Fields extends RelationshipFields<Type>,
    Map extends RelationshipMap<Type, Fields>
>(
    relationship: RelationshipData<Type, Fields>,
    included: RelationshipItem<Type, Fields, Map>[],
) {
    if (relationship == null) return null

    function searchRelation (data: Exclude<RelationshipData<Type, Fields>, null | unknown[]>) {
        const { id, type } = data
        const incl = included.find(f => f.id === id && f.type === type)
        if (!incl) throw new NormalizedError('No included field for resource: ' + id)

        return {
            ...incl.attributes,
            id: incl.id,
            type: incl.type,
        }
    }

    return Array.isArray(relationship)
        ? relationship.map(item => searchRelation(item))
        : searchRelation(relationship)
}

export function findRelationships <
    Type extends ItemType,
    Fields extends RelationshipFields<Type>,
    Map extends RelationshipMap<Type, Fields>
>(
    type: Type,
    relationships: Relationship<Type, Fields>['relationships'] | undefined,
    included: RelationshipItem<Type, Fields, Map>[] | undefined,
) {
    if (relationships == undefined || included == undefined) return {}
    const keys: Fields[] = Object.keys(relationships) as keyof typeof relationships

    return keys.reduce((found, key) => ({
        ...found,
        [getTypeForIncludeKey(type, key)]: findRelation<Type, Fields, Map>(relationships[key]['data'], included),
    }), {} as Record<RelationshipFieldToFieldType<Type, Fields>, NormalizedRelationshipItem<Type, Fields, Map>>)
}
