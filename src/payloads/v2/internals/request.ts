import type {
    Type,
    RelationshipMap,
    RelationshipFields,
} from '../../../schemas/v2'

import type { GetRequestPayload } from './get'
import type { ListRequestPayload } from './list'

export type RequestPayload<
    T extends Type,
    Includes extends RelationshipFields<T> = never,
    Attributes extends RelationshipMap<T, Includes> = never,
    Listing extends boolean = false
> = Listing extends false ? GetRequestPayload<
T,
    Includes,
    Attributes
> : ListRequestPayload<
T,
    Includes,
    Attributes
>
