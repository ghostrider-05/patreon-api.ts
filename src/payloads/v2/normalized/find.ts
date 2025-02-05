/* eslint-disable jsdoc/require-jsdoc */
import {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
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

class NormalizedError extends Error {
    public constructor (message: string) {
        super('[Normalized] ' + message)
    }
}

function getTypeForIncludeKey <Type extends ItemType, Field extends RelationshipFields<Type>>(type: Type, includeKey: Field): RelationshipFieldToFieldType<Type, Field> {
    const fields = QueryBuilder['getResource'](type).relationships
    if (fields == undefined) throw new NormalizedError('No relationships found for type: ' + type)

    // Can exclude never[] as it is an empty array
    const resourceKey = (fields as Exclude<typeof fields, never[]>)
        .find(f => f.resource === includeKey)?.resource

    if (resourceKey == undefined) throw new NormalizedError(`No resource key found for ${includeKey} on ${type}`)
    return resourceKey as RelationshipFieldToFieldType<Type, Field>
}

function findRelation <
    Type extends ItemType,
    Fields extends RelationshipFields<Type>,
    Map extends RelationshipMap<Type, Fields>
>(
    relationship: DataItem<Type, Fields> | DataItems<Type, Fields>,
    included: RelationshipItem<Type, Fields, Map>[],
) {
    function searchRelation ({ data: { id, type } }: DataItem<Type, Fields>) {
        const incl = included.find(f => f.id === id && f.type === type)
        if (!incl) throw new NormalizedError('No included field for resource: ' + id)

        return {
            ...incl.attributes,
            id: incl.id,
            type: incl.type,
        }
    }

    // Typecast to DataItem is okay since it only adds the unused links property
    return Array.isArray(relationship.data)
        ? (relationship.data).map(item => searchRelation({ data: item } as DataItem<Type, Fields>))
        : searchRelation(relationship as DataItem<Type, Fields>)
}

export function findRelationships <
    Type extends ItemType,
    Fields extends RelationshipFields<Type>,
    Map extends RelationshipMap<Type, Fields>
>(
    type: Type,
    // keys: Fields[],
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
