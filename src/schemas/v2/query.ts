/* eslint-disable jsdoc/require-returns */
import { RequestPayload } from '../../payloads/v2/internals/request'

import type {
    BasePatreonQueryType,
    PatreonQuery,
} from '../../rest/v2'

import type {
    RelationshipFields,
    RelationshipFieldToFieldType,
    RelationshipMap,
    RelationshipTypeFields,
    RelationshipTypeToRelationshipField,
} from './relationships'

import * as SchemaResourcesData from './generated/schemas'

import { ItemMap, ItemType, Type } from './item'

import type { If } from '../../utils/generics'

type ValueOrArray<T> = T | T[]

type PaginationQuerySort =
    | string
    | { key: string, descending?: boolean }

export interface QueryRequestOptions {
    cursor?: string
    count?: number
    sort?: ValueOrArray<PaginationQuerySort>
}

// eslint-disable-next-line jsdoc/require-jsdoc
function getResource <T extends Type | ItemType>(t: T) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Object.values(SchemaResourcesData).find(d => d.resource === t)! as (
        typeof SchemaResourcesData[keyof typeof SchemaResourcesData] extends infer D
            ? D extends typeof SchemaResourcesData[keyof typeof SchemaResourcesData]
                ? D['resource'] extends T
                    ? D
                    : never
                : never
            : never
    )
}

// eslint-disable-next-line jsdoc/require-jsdoc
function createCompleteQueryOptions <
    T extends Type
>(t: T) {
    const data = getResource(t)
    const { properties, relationships, resource } = data

    return {
        include: data.relationships.map(n => n.name) as RelationshipFields<T>[],
        attributes: {
            [resource]: properties,
            ...relationships.reduce((obj, n) => ({
                ...obj,
                [n.resource]: Object.values(SchemaResourcesData).find(d => d.resource === n.resource)?.properties ?? [],
            }), {})
        } as RelationshipMap<T, RelationshipFields<T>>
    }
}

export type QueryDefault<IncludeAll extends boolean, T extends Type, L extends boolean> = If<IncludeAll,
    PatreonQuery<T, RelationshipFields<T>, RelationshipMap<T, RelationshipFields<T>>, L>,
    PatreonQuery<T, never, never, L>
>

export class QueryBuilder<
    T extends Type,
    Listing extends boolean,
    Relationships extends RelationshipFields<T> = never,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Attributes extends RelationshipMap<T, Relationships> = {}
> {
    /**
     * The options for the request, e.g. pagination and sorting.
     */
    public requestOptions: QueryRequestOptions | undefined = undefined

    private _relationships: Relationships[] = []
    private _attributes: Attributes = {} as Attributes
    private schema: ReturnType<typeof getResource<T>>

    /**
     * The type to use for extracting the payload type.
     *
     * Do not use as the actual payload as it is an empty string and will not contain the actual payload.
     */
    public readonly _payload_type: RequestPayload<T, Relationships, Attributes, Listing> = <never>''

    public constructor (
        /**
         * The main resource that this query is for.
         */
        public readonly resource: T,

        /**
         * Whether this query is for listing the {@link resource} or only for for getting a single item of the resource.
         */
        // @ts-expect-error unused prop
        private readonly isListing: Listing,
    ) {
        this.schema = getResource(resource)
    }

    protected getRelationshipResourceName <R extends RelationshipFields<T>> (
        relationship: R,
    ): RelationshipFieldToFieldType<T, R> {
        const relationMap = QueryBuilder.getRelationMap(this.schema)
        const relationType = relationMap[relationship]

        if (!relationType) throw new Error(`Unable to find relationship '${relationship}' on resource '${this.resource}'`)
        return relationType as RelationshipFieldToFieldType<T, R>
    }

    /**
     * The raw search params.
     * Use {@link query} for the stringified params.
     */
    public get params (): URLSearchParams {
        return new URLSearchParams({
            ...(this._relationships.length > 0 ? {
                include: [...new Set(this._relationships)].join(','),
            } : {}),
            ...Object
                .keys(this._attributes)
                .reduce((params, key) => ({ ...params, [`fields[${key}]`]: this._attributes[key].join(',') }), {}),
            ...QueryBuilder.resolveQueryOptions(this.requestOptions),
        })
    }

    /**
     * The actual encoded query string.
     * @example `'?fields%5Buser%5D=url%2Cname'`
     */
    public get query (): string {
        return QueryBuilder.toQuery(this.params)
    }

    /**
     * The attributes configured for this query.
     */
    public get attributes (): Attributes {
        return this._attributes
    }

    /**
     * The relationships configured for this query.
     */
    public get relationships (): Relationships[] {
        return this._relationships
    }

    /**
     * The attributes configured for this query on the main resource.
     * For a campaign query, this will be the campaign attributes of the query.
     */
    public get resourceAttributes (): Attributes[T] {
        return this._attributes[this.resource]
    }

    /**
     * The relationships that can be defined on this resource.
     * In the Patreon documentation, see the list of relations on a resource.
     */
    public get schemaRelationships (): ReadonlyArray<RelationshipFields<T>> {
        return this.schema.relationships.map(rel => rel.name)
    }

    /**
     * The attributes that can be defined for this resource.
     * In the Patreon documentation, see the list of properties on a resource.
     */
    public get schemaResourceAttributes (): ReadonlyArray<keyof ItemMap[T]> {
        return <never>this.schema.properties
    }

    /**
     * Gets the attributes configured for a relationship
     * @param relationship The name of the relationship
     * @returns The attributes, or undefined for no attributes
     * @throws When using an invalid relationship for the current resource
     */
    public attributesFor<R extends Relationships> (relationship: R): Attributes[RelationshipFieldToFieldType<T, R>] | undefined {
        // Can be undefined for relationships without attributes added
        return this._attributes[this.getRelationshipResourceName(relationship)] ?? undefined
    }

    /**
     * Set the request options for this query
     * @param options The options for pagination, sorting, etc
     */
    public setRequestOptions (options: QueryRequestOptions): this {
        this.requestOptions = options

        return this
    }

    public includeAllRelationships () {
        const { include } = QueryBuilder.createCompleteOptions(this.resource)

        this._relationships = include

        return this as QueryBuilder<T, Listing, RelationshipFields<T>, Attributes>
    }

    public includeAll () {
        const { include, attributes } = QueryBuilder.createCompleteOptions(this.resource)

        this._relationships = include
        this._attributes = attributes as Attributes

        return this as QueryBuilder<T, Listing, RelationshipFields<T>, Required<RelationshipMap<T, RelationshipFields<T>>>>
    }

    public setAttributes <A extends RelationshipMap<T, Relationships>>(attributes: A) {
        this._attributes = {
            ...this._attributes,
            ...attributes,
        }

        return this as unknown as QueryBuilder<T, Listing, Relationships, A>
    }

    public addRelationships<R extends RelationshipFields<T>>(relationships: R[]) {
        this._relationships.push(...relationships)

        return this as unknown as QueryBuilder<T, Listing, R | Relationships, Attributes>
    }

    public setRelationships<R extends RelationshipFields<T>>(relationships: R[]) {
        this._relationships = relationships

        return this as unknown as QueryBuilder<T, Listing, R, Attributes>
    }

    public addRelationshipAttributes <
        R extends RelationshipFields<T>,
        A extends NonNullable<Pick<RelationshipMap<T, R>, RelationshipFieldToFieldType<T, R>>[RelationshipFieldToFieldType<T, R>]>
    >(relationship: R, attributes: A) {
        if (!this._relationships.includes(relationship)) {
            this._relationships.push(relationship)
        }

        const relationResource = this.getRelationshipResourceName(relationship)

        // @ts-expect-error Weird TS typing stuff
        this._attributes[relationResource] ??= [] as A
        // @ts-expect-error Weird TS typing stuff
        this._attributes[relationResource]?.push(...attributes)

        return this as unknown as QueryBuilder<T, Listing, Relationships | R,
            Attributes & {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                [Item in RelationshipFieldToFieldType<T, R>]: (Attributes extends { [K in RelationshipFieldToFieldType<T, R>]: any }
                        ? Attributes[RelationshipFieldToFieldType<T, R>][number] | A[number]
                        : A[number]
                )[]
            }
        >
    }

    public setRelationshipAttributes <
        R extends RelationshipFields<T>,
        A extends NonNullable<Pick<RelationshipMap<T, R>, RelationshipFieldToFieldType<T, R>>[RelationshipFieldToFieldType<T, R>]>
    >(relationship: R, attributes: A) {
        if (!this._relationships.includes(relationship)) {
            this._relationships.push(relationship)
        }

        // @ts-expect-error Weird TS typing stuff
        this._attributes[this.getRelationshipResourceName(relationship)] = attributes

        return this as unknown as QueryBuilder<T, Listing, Relationships | R,
            (Attributes extends { [K in RelationshipFieldToFieldType<T, R>]: unknown }
                ? Omit<Attributes, `${RelationshipFieldToFieldType<T, R>}`>
                : Attributes
            ) & { [K in `${RelationshipFieldToFieldType<T, R>}`]: A }
        >
    }

    public static get campaign () {
        return new QueryBuilder(Type.Campaign, false)
    }

    public static get campaignMembers () {
        return new QueryBuilder(Type.Member, true)
    }

    public static get campaignPosts () {
        return new QueryBuilder(Type.Post, true)
    }

    public static get campaigns () {
        return new QueryBuilder(Type.Campaign, true)
    }

    public static get identity () {
        return new QueryBuilder(Type.User, false)
    }

    public static get member () {
        return new QueryBuilder(Type.Member, false)
    }

    public static get post () {
        return new QueryBuilder(Type.Post, false)
    }

    public static get webhooks () {
        return new QueryBuilder(Type.Webhook, true)
    }

    /**
     * Get all options that can be included in a query
     * @param resource The resource to get the options for
     * @returns the relationship names in `include` and the attributes in `attributes`
     */
    public static createCompleteOptions <T extends Type>(resource: T) {
        return createCompleteQueryOptions<T>(resource)
    }

    /** @deprecated This will be removed some time after buildQuery has been removed */
    public get build () {
        return QueryBuilder.createFunctionBuilder(this)
    }

    /**
     * Create a function builder from a query builder.
     *
     * This is to support the legacy `buildQuery`.
     * @deprecated
     * @param builder The query builder to convert
     */
    public static createFunctionBuilder <T extends Type, Listing extends boolean> (builder: QueryBuilder<T, Listing>) {
        return function <Includes extends RelationshipFields<`${T}`> = never>(include?: Includes[]) {
            return function <
                Attributes extends RelationshipMap<T, Includes>,
            >(attributes?: Attributes, options?: QueryRequestOptions): QueryBuilder<T, Listing, Includes, Attributes> {
                if (options != undefined) {
                    builder.setRequestOptions(options)
                }

                return builder
                    .setRelationships<Includes>(include ?? [])
                    .setAttributes<Attributes>((attributes ?? {}) as Attributes)
            }
        }
    }

    /**
     * Create a record to convert relation names to resources.
     * @param type The resource to create the map for
     * @throws When using an invalid type
     */
    public static createRelationMap <T extends ItemType> (type: T) {
        const resource = this.getResource<T>(type)

        return this.getRelationMap(resource)
    }

    /**
     * Convert a relationship name to a resource name
     * @param type The resource that holds the relationship
     * @param relation The name of the relationship to find the resource name of
     * @throws When using an invalid type
     */
    public static convertRelationToType <
        T extends ItemType,
        R extends RelationshipFields<T>
    >(type: T, relation: R): RelationshipFieldToFieldType<T, R> {
        return this.createRelationMap(type)[relation]
    }

    /**
     * Convert a relation resource name to a relationship name
     * @param type The resource that holds the relationship
     * @param relationType The resource name of the relationship to find the relationship name of
     * @throws When using an invalid type or unknown relation type
     */
    public static convertTypeToRelation <
        T extends ItemType,
        R extends RelationshipTypeFields<T>
    >(type: T, relationType: R): RelationshipTypeToRelationshipField<T, R> {
        const map = this.createRelationMap(type)

        const key = (Object.keys(map) as RelationshipFields<T>[]).find(name => map[name] === relationType)
        if (!key) throw new Error('No relationship with type ' + relationType + 'found on resource: ' + type)
        return key
    }

    public static fromParams<Q extends BasePatreonQueryType<Type, boolean>>(params: URLSearchParams): Q {
        return {
            params,
            query: this.toQuery(params),
            // @ts-expect-error Ignore Typescript error for private property
            _payload_type: <Q['_payload_type']>'',
        } as Q
    }

    protected static getRelationMap<T extends Type | ItemType>(resource: ReturnType<typeof QueryBuilder.getResource<T>>) {
        return resource.relationships.reduce((obj, relation) => ({
            [relation.name]: relation.resource,
            ...obj,
        }), {} as { [R in RelationshipFields<T>]: RelationshipFieldToFieldType<T, R> })
    }

    protected static getResource <T extends Type | ItemType>(t: T) {
        const resource = getResource(t)
        if (!resource) throw new Error('No resource found for type: ' + t)

        return resource
    }

    protected static toQuery(params: URLSearchParams): string {
        return params.size > 0 ? '?' + params.toString() : ''
    }

    /**
     * Helper function to convert query options to parameter options
     * @param options the request options
     * @returns the parameters options
     */
    protected static resolveQueryOptions(options?: QueryRequestOptions): Record<string, string> {
        const params: Record<string, string> = {}

        if (options?.count != undefined) params['page[count]'] = options.count.toString()
        if (options?.cursor != undefined) params['page[cursor]'] = options.cursor
        if (options?.sort != undefined) params['sort'] = this.resolveSortOptions(options.sort)

        return params
    }

    /**
     * Helper function to convert pagination sort options to a parameter
     * @param options the sort options
     * @returns the parameter to include in the query
     */
    protected static resolveSortOptions(options: ValueOrArray<PaginationQuerySort>): string {
        return (Array.isArray(options) ? options : [options])
            .map(option => {
                return typeof option === 'string'
                    ? option
                    : (option.descending ? `-${option.key}` : option.key)
            })
            .join(',')
    }
}
