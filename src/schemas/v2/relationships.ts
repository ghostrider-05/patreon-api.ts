import { AttributeItem, DataItem, DataItems, Item, ItemMap, ItemType, Type } from './item'

// TODO: correct related relations
interface RelationshipTypeMap extends Record<ItemType, BaseRelationDataItem<ItemType>> {
    address: {
        [Type.Campaign]: [true, false]
        [Type.User]: [false, false]
    }
    benefit: {
        [Type.Campaign]: [true, false]
        // TODO: add `campaign_installation` when documentated
        [Type.Deliverable]: [true, false]
        [Type.Tier]: [true, false]
    }
    campaign: {
        [Type.Benefit]: [true, false]
        // TODO: add `campaign_installation` when documentated
        // TODO: add `categories` when documentated
        [Type.User]: ['creator', false, false]
        [Type.Goal]: [true, false]
        [Type.Tier]: [true, false]
    }
    deliverable: {
        [Type.Benefit]: [false, false]
        [Type.Campaign]: [false, false]
        [Type.Member]: [false, false]
        [Type.User]: [false, false]
    }
    goal: {
        [Type.Campaign]: [false, false]
    }
    media: {
        // Nothing
    }
    member: {
        [Type.Address]: [false, false]
        [Type.Campaign]: [false, false]
        [Type.Tier]: ['currently_entitled_tiers', true, false]
        [Type.PledgeEvent]: ['pledge_history', true, false]
        [Type.User]: [false, false]
    }
    'pledge-event': {
        [Type.Campaign]: [false, false]
        [Type.User]: ['patron', false, false]
        [Type.Tier]: [false, false]
    }
    post: {
        [Type.User]: [false, false]
        [Type.Campaign]: [false, false]
    }
    tier: {
        [Type.Benefit]: [true, false]
        [Type.Campaign]: [false, false]
        [Type.Media]: ['tier_image', false, false]
    }
    user: {
        [Type.Campaign]: [false, false]
        [Type.Member]: ['memberships', true, false]
    }
}

type ResolvedRelation<T extends `${Type}`> = {
    [R in keyof RelationshipTypeMap[T]]: R extends string
        ? RelationshipTypeMap[T][R] extends [boolean, boolean]
            ? [R, RelationshipTypeMap[T][R][0] extends true ? `${R}s` : `${R}`, RelationshipTypeMap[T][R][0], RelationshipTypeMap[T][R][1]]
            : RelationshipTypeMap[T][R] extends [string, boolean, boolean]
                ? [R, RelationshipTypeMap[T][R][0], RelationshipTypeMap[T][R][1], RelationshipTypeMap[T][R][2]]
                : never
            : never
}

type BaseRelationDataItem<T extends string> = Partial<Record<T, [string, boolean, boolean] | [boolean, boolean]>>
type RelationStringIndex =
    | 0
    | 1

type RelationDataItem<RelationType extends Type | `${Type}`, Index extends RelationStringIndex> =
    ResolvedRelation<`${RelationType}`> extends Partial<Record<Type, [Type, string, boolean, boolean]>>
    ? {
        [Key in ResolvedRelation<RelationType>[keyof ResolvedRelation<RelationType>][Index]]:
            ResolvedRelation<RelationType>[keyof ResolvedRelation<RelationType>] extends infer Relation
                // ? Relation
                ? Relation extends [Type, string, boolean, boolean]
                    // ? R : never
                    ? Key extends Relation[Index]
                        ? Relation[2] extends true
                            ? DataItems<Relation[0], Relation[3]>
                            : DataItem<Relation[0], Relation[3]>
                        : never
                    : never
                : never
    }
    : never

export type RelationshipFields<T extends Type | `${Type}`> = keyof RelationDataItem<T, 1> extends infer Key
    ? Key extends string
        ? Key
        : never
    : never

export type RelationshipFieldToFieldType<T extends Type | `${Type}`, F extends RelationshipFields<T>> =
    RelationDataItem<Type.Campaign, 1>[Extract<RelationshipFields<Type.Campaign>, F>]['data'] extends infer I
        ? I extends unknown []
            ? I[number] extends Item<Type> ? I[number]['type'] : never
            : I extends Item<Type> ? I['type'] : never
        : never

export type Relationship<T extends Type | `${Type}`, Keys extends RelationshipFields<T>> = {
    relationships: Pick<RelationDataItem<T, 1>, Keys>
}

export type RelationshipTypeFields<T extends `${Type}` | Type> = keyof RelationDataItem<T, 0> extends infer K ? K extends `${Type}` ? K : never : never
export type RelationshipMap<T extends `${Type}`, Keys extends RelationshipFields<T>> = {
    [Item in (RelationshipFieldToFieldType<T, Keys> | T)]?: Item extends keyof ItemMap ? (keyof ItemMap[Item])[] : never
}

type RelationshipItemProperty<T extends `${Type}`, Keys extends RelationshipTypeFields<T>, Map extends RelationshipMap<T, Keys>> = {
    [K in Keys]: K extends keyof Map ? Map[K] extends infer Value ? Value extends string[] ? Value[number] : never : never : never
}

export type RelationshipItem<T extends `${Type}`, Keys extends RelationshipFields<T>, Map extends RelationshipMap<T, Keys>> = {
    [K in RelationshipFieldToFieldType<T, Keys>]: AttributeItem<K, Pick<ItemMap[K], RelationshipItemProperty<T, RelationshipFieldToFieldType<T, Keys>, Map>[K]>>
}[RelationshipFieldToFieldType<T, Keys>]

export type RelationshipMainItemAttributes<T extends `${Type}`, Keys extends `${RelationshipTypeFields<T>}`, Map extends RelationshipMap<T, Keys>> =
    Pick<ItemMap[T], Map[T] extends infer Value ? Value extends string[] ? Value[number] : never : never>
