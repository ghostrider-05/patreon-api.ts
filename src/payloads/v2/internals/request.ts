import { Type, RelationshipMap, RelationshipFields } from '../../../schemas/v2'

import { GetRequestPayload } from './get'
import { ListRequestPayload } from './list'

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
