/* eslint-disable jsdoc/require-jsdoc */
import type {
    ItemType,
    Relationship,
    RelationshipData,
    RelationshipFields,
    RelationshipItem,
    RelationshipMap,
} from '../../../schemas/v2/'

import type { NormalizedRelationshipItem } from './payload'

class NormalizedError extends Error {
    public constructor (message: string) {
        super('[Normalized] ' + message)
    }
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
    // @ts-expect-error unused variable (internal)
    type: Type,
    relationships: Relationship<Type, Fields>['relationships'] | undefined,
    included: RelationshipItem<Type, Fields, Map>[] | undefined,
) {
    if (relationships == undefined || included == undefined) return {}
    const keys: Fields[] = Object.keys(relationships) as keyof typeof relationships

    return keys.reduce((found, key) => ({
        ...found,
        [key]: findRelation<Type, Fields, Map>(relationships[key]['data'], included),
    }), {} as Record<Fields, NormalizedRelationshipItem<Type, Fields, Map>>)
}
