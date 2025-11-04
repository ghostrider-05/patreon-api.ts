import type {
    BasePatreonQuery,
    Item,
    ItemMap,
    ItemType,
    PatreonQuery,
    RelationshipFieldToFieldType,
    RelationshipFields,
    RelationshipIsArray,
    RelationshipMainItemAttributes,
    RelationshipMap,
    RelationshipTypeFields,
    Type,
} from '../../../schemas/v2/'

import type { AdditionalKeys } from '../../../utils'

import { ListRequestPayload } from '../internals/list'
import type { RequestPayload } from '../internals/request'

import type { AnyToCamelCase } from './capitalize'

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
    [K in RelationshipFieldToFieldType<T, Key>]: RelationshipIsArray<T, K> extends true
        ? NormalizedAttributeItem<K, Pick<ItemMap[K], NormalizedRelationshipItemProperty<T, RelationshipFieldToFieldType<T, Key>, Map>[K]>>[]
        : NormalizedAttributeItem<K, Pick<ItemMap[K], NormalizedRelationshipItemProperty<T, RelationshipFieldToFieldType<T, Key>, Map>[K]>>
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
    Listing extends boolean
> = Listing extends true
    ? NormalizedListRequestPayload<Type, Keys, Attributes>
    : NormalizedGetRequestPayload<Type, Keys, Attributes>

export type NormalizeRequest<
    Request extends RequestPayload<Type, RelationshipFields<Type>, RelationshipMap<Type, RelationshipFields<Type>>, boolean>
> = Request extends RequestPayload<infer T, infer R, infer M, boolean>
    ? ListRequestPayload<T, R, M> extends Request
        ? NormalizedListRequestPayload<T, R, M>
        : NormalizedGetRequestPayload<T, R, M>
    : never

export type GetNormalizedResponsePayload<Query extends BasePatreonQuery> = Query extends PatreonQuery<infer T, infer I, infer A, infer L>
    ? L extends false
        ? NormalizedGetRequestPayload<T, I, A>
        : NormalizedListRequestPayload<T, I, A>
    : never

export type SimplifyRequest<
    Request extends RequestPayload<Type, RelationshipFields<Type>, RelationshipMap<Type, RelationshipFields<Type>>, boolean>
> = Request extends RequestPayload<infer T, infer R, infer M, boolean>
    ? ListRequestPayload<T, R, M> extends Request
        ? AnyToCamelCase<NormalizedListRequestPayload<T, R, M>>
        : AnyToCamelCase<NormalizedGetRequestPayload<T, R, M>>
    : never

export type GetSimplifiedResponsePayload<Query extends BasePatreonQuery> = Query extends PatreonQuery<infer T, infer I, infer A, infer L>
    ? L extends false
        ? AnyToCamelCase<NormalizedGetRequestPayload<T, I, A>>
        : AnyToCamelCase<NormalizedListRequestPayload<T, I, A>>
    : never
