import type {
    GetNormalizedResponsePayload,
    GetSimplifiedResponsePayload,
} from '../../../payloads/v2/normalized/payload'

import {
    type BasePatreonQuery,
    type GetResponsePayload,
    QueryBuilder,
    type QueryDefault,
    Type,
} from '../../../schemas/v2'

// TODO: replace with generics once https://github.com/Microsoft/TypeScript/issues/1213 is closed
export interface ResponseTransformMap<Query extends BasePatreonQuery> {
    default: (res: GetResponsePayload<Query>) => GetResponsePayload<Query>
    simplified: (res: GetResponsePayload<Query>) => GetSimplifiedResponsePayload<Query>
    normalized: (res: GetResponsePayload<Query>) => GetNormalizedResponsePayload<Query>
}

export type ResponseTransformType = keyof ResponseTransformMap<BasePatreonQuery>

export interface PatreonClientTransformOptions<IncludeAll extends boolean> {
    /**
     * Whether to include all relationships and attributes in the query
     * @default false
     */
    includeAllQueries: IncludeAll
}

export interface TransformClientOptions<
    TransformType extends ResponseTransformType,
    IncludeAll extends boolean,
> extends PatreonClientTransformOptions<IncludeAll> {
    transformType: TransformType
    parser: ResponseTransformMap<BasePatreonQuery>[TransformType]
}

export class TransformClient<
    TransformType extends ResponseTransformType,
    IncludeAll extends boolean,
> {
    protected transformType: TransformType
    private parser: ResponseTransformMap<BasePatreonQuery>[TransformType]
    protected _include_all_query: IncludeAll

    public constructor (options: TransformClientOptions<TransformType, IncludeAll>) {
        this.transformType = options.transformType
        this.parser = options.parser
        this._include_all_query = options.includeAllQueries
    }

    protected parseResponse <Query extends BasePatreonQuery> (
        res: GetResponsePayload<Query>,
    ): ReturnType<ResponseTransformMap<Query>[TransformType]> {
        return this.parser(<never>res)
    }

    protected getDefaultQuery <T extends Type, L extends boolean>(builder: QueryBuilder<T, L>): QueryDefault<IncludeAll, T, L> {
        return this._include_all_query ? builder.includeAll() : builder
    }
}
