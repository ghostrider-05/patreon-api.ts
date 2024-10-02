import {
    type Member,
    type User,
} from 'patreon-api.ts'

import { defaultLinkedRolesData } from './default'

/**
 *
 * @param config
 */
export function getAttributes (config: Config.LinkedRolesConfig) {
    const attributes = (config.data ?? defaultLinkedRolesData).map(item => item.attribute)

    return {
        user: attributes.filter(t => t.resource === 'user').map(t => t.key),
        member: attributes.filter(t => t.resource === 'member').map(t => t.key),
    }
}

/**
 *
 * @param config
 * @param user
 * @param member
 */
export function getLinkedRolesMemberData (config: Config.LinkedRolesConfig, user: User, member: Member): Record<string, string | number> {
    const data: Record<string, string | number> = {}

    for (const { attribute, metadata } of (config.data ?? defaultLinkedRolesData)) {
        const value = attribute.resource === 'member'
            ? member[attribute.key]
            : attribute.resource === 'user'
                ? user[attribute.key]
                : (() => { throw new Error('Invalid resource type') })()

        const match = attribute.required_match != undefined
            ? attribute.required_match === value
            : value

        if (typeof match === 'boolean') {
            data[metadata.key] = match ? 1 : 0
        } else if (typeof match === 'string' || typeof match === 'number') {
            data[metadata.key] = match
        } else if (match == null) {
            data[metadata.key] = 0
        }
    }

    return data
}
