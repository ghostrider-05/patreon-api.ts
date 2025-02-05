import {
    Type,
    type AttributeItem,
    type DataItem,
    type DataItems,
    type Item,
    type ItemMap,
    type ItemType
} from './item'

type Multiple<
    IncludedKey extends string,
    Appendix extends string = 's'
> = [`${IncludedKey}${Appendix}`, true]

interface RelationshipTypeMap extends Record<ItemType, BaseRelationDataItem<ItemType>> {
    address: {
        [Type.Campaign]: Multiple<Type.Campaign>
        [Type.User]: [false]
    }
    benefit: {
        [Type.Campaign]: [true]
        // TODO: add `campaign_installation` when documentated
        [Type.Deliverable]: [true]
        [Type.Tier]: [true]
    }
    campaign: {
        [Type.Benefit]: Multiple<Type.Benefit>
        // TODO: add `campaign_installation` when documentated
        // TODO: add `categories` when documentated
        [Type.User]: ['creator', false]
        /** @deprecated Will always be empty */
        [Type.Goal]: Multiple<Type.Goal>
        [Type.Tier]: Multiple<Type.Tier>
    }
    client: {
        // TODO: add `apps` when documented
        [Type.Campaign]: [false]
        // TODO: add `creator_token` when documented
        [Type.User]: [false]
    }
    deliverable: {
        [Type.Benefit]: [false]
        [Type.Campaign]: [false]
        [Type.Member]: [false]
        [Type.User]: [false]
    }
    /** @deprecated */
    goal: {
        [Type.Campaign]: [false]
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    media: {
    }
    member: {
        [Type.Address]: [false]
        [Type.Campaign]: [false]
        [Type.Tier]: ['currently_entitled_tiers', true]
        [Type.PledgeEvent]: ['pledge_history', true]
        [Type.User]: [false]
    }
    'pledge-event': {
        [Type.Campaign]: [false]
        [Type.User]: ['patron', false]
        [Type.Tier]: [false]
    }
    post: {
        [Type.User]: [false]
        [Type.Campaign]: [false]
    }
    tier: {
        [Type.Benefit]: Multiple<Type.Benefit>
        [Type.Campaign]: [false]
        [Type.Media]: ['tier_image', false]
    }
    user: {
        [Type.Campaign]: [false]
        [Type.Member]: ['memberships', true]
    }
    webhook: {
        [Type.Campaign]: [false]
        [Type.Client]: [false]
    }
}

type ResolvedRelation<T extends `${Type}`> = {
    [R in keyof RelationshipTypeMap[T]]: R extends string
        ? RelationshipTypeMap[T][R] extends [boolean]
            ? [R, RelationshipTypeMap[T][R][0] extends true ? `${R}s` : `${R}`, RelationshipTypeMap[T][R][0]]
            : RelationshipTypeMap[T][R] extends [string, boolean]
                ? [R, RelationshipTypeMap[T][R][0], RelationshipTypeMap[T][R][1]]
                : never
            : never
}

type BaseRelationDataItem<T extends string> = Partial<Record<T, [string, boolean] | [boolean]>>
type RelationStringIndex =
    | 0
    | 1

type RelationDataItem<RelationType extends Type | `${Type}`, Index extends RelationStringIndex> =
    ResolvedRelation<`${RelationType}`> extends Partial<Record<Type, [Type, string, boolean]>>
    ? {
        [Key in ResolvedRelation<RelationType>[keyof ResolvedRelation<RelationType>][Index]]:
            ResolvedRelation<RelationType>[keyof ResolvedRelation<RelationType>] extends infer Relation
                ? Relation extends [Type, string, boolean]
                    ? Key extends Relation[Index]
                        ? Relation[2] extends true
                            ? DataItems<Relation[0], false>
                            : DataItem<Relation[0], true>
                        : never
                    : never
                : never
    }
    : never

/**
 * For an resource, returns the relationship names that this resource can have.
 * In the API documentation
 * @see https://docs.patreon.com/#apiv2-resources beneath each resource table the `relationships` table
 */
export type RelationshipFields<T extends Type | `${Type}`> = keyof RelationDataItem<T, 1> extends infer Key
    ? Key extends string
        ? Key
        : never
    : never

export type RelationshipFieldToFieldType<T extends Type | `${Type}`, F extends RelationshipFields<T>> =
    RelationDataItem<T, 1>[Extract<RelationshipFields<T>, F>]['data'] extends infer I
        ? I extends unknown []
            ? I[number] extends Item<Type> ? I[number]['type'] : never
            : I extends Item<Type> ? I['type'] : never
        : never

export type RelationshipIsArray<T extends `${Type}`, R extends RelationshipFields<T>> = ResolvedRelation<T>[R][2]

export type Relationship<T extends Type | `${Type}`, Keys extends RelationshipFields<T>> = {
    relationships: Pick<RelationDataItem<T, 1>, Keys>
}

/**
 * Same as {@link RelationshipFields}, but instead of the relationship names it returns the type of item for each name
 */
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
