export interface Route {
    route: string
    relationship_type: string
    list?: true
    requires_id?: true
}

export interface LibraryData {
    version: number
    base: string
    headers: {
        userAgent: string
        response: Record<'id' | 'sha', string>
    }

    routes: Route[]
    relationships: Record<string, {
        resourceKey: string;
        includeKey: string;
        isArray: boolean;
        isRelated: boolean;
    }[]>
    schemas: Record<string, string[] | readonly string[]>
    webhook: {
        triggers: string[]
    }
}
