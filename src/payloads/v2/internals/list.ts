import type { ListRequestPaginationPayload } from './pagination'

import type {
    AttributeItem,
    Relationship,
    Type as ItemType,
    RelationshipMap,
    RelationshipItem,
    RelationshipMainItemAttributes,
    RelationshipFields,
} from '../../../schemas/v2'

import type { AdditionalKeys } from '../../../utils'

export type ListRequestPayload<
    Type extends `${ItemType}` | ItemType,
    Keys extends RelationshipFields<Type>,
    Attributes extends RelationshipMap<Type, Keys>,
> = {
    data: (AttributeItem<Type, RelationshipMainItemAttributes<Type, Keys, Attributes>> & AdditionalKeys<
    Keys,
    Relationship<Type, Keys>
>)[]
    meta: {
        pagination: ListRequestPaginationPayload
    }
} & AdditionalKeys<
    Keys,
    { included: RelationshipItem<Type, Keys, Attributes>[] }
>;
