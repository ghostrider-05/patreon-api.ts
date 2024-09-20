import { AttributeItem, DataItem, DataItems, Item, ItemMap, ItemType, Type } from './item'

type Multiple<
    IncludedKey extends string,
    Related extends boolean,
    Appendix extends string = 's'
> = [`${IncludedKey}${Appendix}`, true, Related]

// TODO: correct related relations
interface RelationshipTypeMap extends Record<ItemType, BaseRelationDataItem<ItemType>> {
    address: {
        [Type.Campaign]: Multiple<Type.Campaign, false>
        [Type.User]: [false, false]
    }
    benefit: {
        [Type.Campaign]: [true, false]
        // TODO: add `campaign_installation` when documentated
        [Type.Deliverable]: [true, false]
        [Type.Tier]: [true, false]
    }
    campaign: {
        [Type.Benefit]: Multiple<Type.Benefit, false>
        // TODO: add `campaign_installation` when documentated
        // TODO: add `categories` when documentated
        [Type.User]: ['creator', false, false]
        [Type.Goal]: Multiple<Type.Goal, false>
        [Type.Tier]: Multiple<Type.Tier, false>
    }
    client: {
        // TODO: add `apps` when documented
        [Type.Campaign]: [false, false]
        // TODO: add `creator_token` when documented
        [Type.User]: [false, false]
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
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
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
        [Type.Benefit]: Multiple<Type.Benefit, false>
        [Type.Campaign]: [false, false]
        [Type.Media]: ['tier_image', false, false]
    }
    user: {
        [Type.Campaign]: [false, false]
        [Type.Member]: ['memberships', true, false]
    }
    webhook: {
        [Type.Campaign]: [false, false]
        [Type.Client]: [false, false]
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
