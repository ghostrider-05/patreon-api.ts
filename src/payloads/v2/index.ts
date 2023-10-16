/* eslint-disable @typescript-eslint/no-unused-vars */
import { RelationshipFields, RelationshipMap, Type } from '../../schemas/v2'
import { RequestPayload } from './internals/request'

type GetRequestType =
    | Type.Campaign
    | Type.Member
    | Type.Post

export type SingleResourcePayload<
    ResourceType extends Extract<
        Type,
        GetRequestType
            | Type.User
    >,
    Includes extends RelationshipFields<ResourceType> = never,
    Attributes extends RelationshipMap<ResourceType, Includes> = never
> = {
    [T in ResourceType]: RequestPayload<
        T,
        Includes,
        Attributes,
        false
    >
}[ResourceType]

export type ListResourcePayload<
    ResourceType extends Extract<
        Type,
        GetRequestType
    >,
    Includes extends RelationshipFields<ResourceType> = never,
    Attributes extends RelationshipMap<ResourceType, Includes> = never
> = {
    [T in ResourceType]: RequestPayload<
        T,
        Includes,
        Attributes,
        true
    >
}[ResourceType]
