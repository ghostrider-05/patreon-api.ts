import type {
    AttributeItem,
    Relationship,
    Type as ItemType,
    RelationshipMap,
    RelationshipItem,
    RelationshipMainItemAttributes,
    // RelationshipTypeFields,
    RelationshipFields,
} from '../../../schemas/v2'

import type { AdditionalKeys } from '../../../utils'

export type GetRequestPayload<
    Type extends `${ItemType}`,
    Keys extends RelationshipFields<Type>,
    Attributes extends RelationshipMap<Type, Keys>,
> = {
    data: AttributeItem<Type, RelationshipMainItemAttributes<Type, Keys, Attributes>> & AdditionalKeys<
    Keys,
    Relationship<Type, Keys>
>
    links: {
        self: string
    }
} & AdditionalKeys<
    Keys,
    { included: RelationshipItem<Type, Keys, Attributes>[] }
>;
