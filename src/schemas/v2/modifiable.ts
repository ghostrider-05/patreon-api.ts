/* eslint-disable @typescript-eslint/no-empty-object-type */
import { RequestMethod } from '../../rest/v2'

import {
    type AttributeItem,
    Type,
    type ItemMap,
} from './item'

import {
    type Relationship,
    type RelationshipFields,
} from './relationships'

export type WriteResourceType =
    | Type.Webhook

type ModifiableMap = {
    [T in WriteResourceType]: Partial<Record<RequestMethod, {
        requiredAttributes?: keyof ItemMap[T]
        optionalAttributes?: keyof ItemMap[T]
        requiredRelationships?: RelationshipFields<T>
    }>>
}

interface ModifiableResourceMap extends ModifiableMap {
    [Type.Webhook]: {
        [RequestMethod.Post]: {
            requiredAttributes:
                | 'uri'
                | 'triggers'
            requiredRelationships:
                | 'campaign'
        }
        [RequestMethod.Patch]: {
            optionalAttributes:
                | 'uri'
                | 'triggers'
                | 'paused'
        }
    }
}

type ModifiableResourceAttributes<
    T extends WriteResourceType,
    Method extends RequestMethod
> = ModifiableResourceMap[T] extends { [K in Method]: unknown }
    ? (ModifiableResourceMap[T][Method] extends { requiredAttributes: keyof ItemMap[T] }
        ? Pick<ItemMap[T], ModifiableResourceMap[T][Method]['requiredAttributes']>
        : {})
        & (ModifiableResourceMap[T][Method] extends { optionalAttributes: keyof ItemMap[T] }
            ? Partial<Pick<ItemMap[T], ModifiableResourceMap[T][Method]['optionalAttributes']>>
            : {})
    : never

// Write relationships should not be nullable (I think)
type ModifiableResourceRelationships<
    T extends WriteResourceType,
    Method extends RequestMethod
> = ModifiableResourceMap[T] extends { [K in Method]: unknown }
    ? (ModifiableResourceMap[T][Method] extends { requiredRelationships: RelationshipFields<T> }
        ? Relationship<T, ModifiableResourceMap[T][Method]['requiredRelationships']>['relationships'] extends infer RequiredRels
        ? { relationships: {
            [R in keyof RequiredRels]: {
                data: RequiredRels[R] extends { data: unknown }
                    ? RequiredRels[R]['data'] extends infer Data
                        ? NonNullable<Data>
                        : never
                    : never
            }
        } }
        : {} : {})
    : never


export type WriteResourcePayload<
    T extends WriteResourceType,
    Method extends RequestMethod
> = {
    data: (Method extends RequestMethod.Post
        ? Omit<AttributeItem<T, ModifiableResourceAttributes<T, Method>>, 'id'>
        : AttributeItem<T, ModifiableResourceAttributes<T, Method>>)
        & ModifiableResourceRelationships<T, Method>
}

export type WriteResourceResponse<
    T extends WriteResourceType,
> = {
    data: AttributeItem<T, { [K in keyof ItemMap[T]]: ItemMap[T][K] }>
}
