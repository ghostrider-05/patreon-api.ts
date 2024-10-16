import { SchemaRelationshipKeys, Type } from '../../../../v2'

import { RestClient } from '../../../../rest/v2/oauth2/rest'

// eslint-disable-next-line jsdoc/require-jsdoc
export function getResourceParameters (resource: Type) {
    const relationshipKeys = SchemaRelationshipKeys as Record<Type, {
        resourceKey: Type
        includeKey: string
        isArray: boolean
        isRelated: boolean
    }[]>

    const includes = relationshipKeys[resource].map(({ includeKey }) => includeKey)

    const resources = includes.map(includeKey => {
        // Throw when includes field is not found
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return relationshipKeys[resource].find(key => key.includeKey === includeKey)!.resourceKey
    })

    return {
        includes,
        resources,
        includesKeys: relationshipKeys[resource],
    }
}

export default {
    id: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
            type: 'string',
        },
    },
    campaign_id: {
        name: 'campaign_id',
        in: 'path',
        required: true,
        schema: {
            type: 'string',
        },
    },
    userAgent: {
        name: 'User-Agent',
        in: 'header',
        required: true,
        schema: {
            type: 'string',
            default: new RestClient().userAgent,
        }
    },
}
