import { BasePatreonQuery, PatreonQuery } from '../../../rest/v2/query'
import type {
    Item,
    ItemMap,
    ItemType,
    RelationshipFieldToFieldType,
    RelationshipFields,
    RelationshipMainItemAttributes,
    RelationshipMap,
    RelationshipTypeFields,
} from '../../../schemas/v2/'

import type { AdditionalKeys } from '../../../utils'

export type NormalizedAttributeItem<
    Type extends ItemType,
    Attributes extends Record<string, unknown> = Record<string, never>
> = Item<Type> & Attributes

type NormalizedRelationshipItemProperty<T extends ItemType, Key extends RelationshipTypeFields<T>, Map extends RelationshipMap<T, Key>> = {
    [K in Key]: Key extends keyof Map ? Map[Key] extends infer Value ? Value extends string[] ? Value[number] : never : never : never
}

export type NormalizedRelationshipItem<
    T extends ItemType,
    Key extends RelationshipFields<T>,
    Map extends RelationshipMap<T, Key>
> = {
    [K in RelationshipFieldToFieldType<T, Key>]: NormalizedAttributeItem<K, Pick<ItemMap[K], NormalizedRelationshipItemProperty<T, RelationshipFieldToFieldType<T, Key>, Map>[K]>>
}[RelationshipFieldToFieldType<T, Key>]

export type NormalizedGetRequestPayload<
    Type extends `${ItemType}`,
    Keys extends RelationshipFields<Type>,
    Attributes extends RelationshipMap<Type, Keys>,
> = NormalizedAttributeItem<Type, RelationshipMainItemAttributes<Type, Keys, Attributes>>
    & AdditionalKeys<Keys, { [Key in Keys]: NormalizedRelationshipItem<Type, Key, Attributes> }>
    & { link: string }

export type NormalizedListRequestPayload<
    Type extends `${ItemType}`,
    Keys extends RelationshipFields<Type>,
    Attributes extends RelationshipMap<Type, Keys>,
> = {
    data: (
        NormalizedAttributeItem<Type, RelationshipMainItemAttributes<Type, Keys, Attributes>>
        & AdditionalKeys<Keys, { [Key in Keys]: NormalizedRelationshipItem<Type, Key, Attributes> }>
    )[]
    pagination: {
        total: number
        next_cursor: string | null
    }
}

export type NormalizedRequestPayload<
    Type extends `${ItemType}`,
    Keys extends RelationshipFields<Type>,
    Attributes extends RelationshipMap<Type, Keys>,
> =
    | NormalizedGetRequestPayload<Type, Keys, Attributes>
    | NormalizedListRequestPayload<Type, Keys, Attributes>

export type GetNormalizedResponsePayload<Query extends BasePatreonQuery> = Query extends PatreonQuery<infer T, infer I, infer A, infer L>
    ? L extends true ? NormalizedListRequestPayload<T, I, A> : NormalizedGetRequestPayload<T, I, A>
    : never
