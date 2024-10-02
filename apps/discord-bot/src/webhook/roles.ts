import { Routes } from 'discord-api-types/v10'
import {
    type PatreonWebhookMemberTrigger,
    PatreonWebhookTrigger,
    type WebhookPayload,
} from 'patreon-api.ts'

import { makeDiscordRequest } from '../interactions/'
import { getMemberStorage } from './storage'

/**
 *
 * @param config
 * @param env
 */
function getStorage (config: Config.CampaignConfig, env: Config.Env) {
    if (config.guild_roles == undefined) return undefined
    if (!env.use_bot_scope) {
        throw new Error('Cannot update guild roles without a bot scope')
    }

    const storage = getMemberStorage(env, config.guild_roles.storage_env, config.id)
    if (!storage) throw new Error()

    return storage
}

interface Options {
    config: Config.CampaignConfig
    env: Config.Env
    trigger: Config.WebhookTrigger
    member: WebhookPayload<PatreonWebhookMemberTrigger>['data']
}

export const requiredTriggers = [
    PatreonWebhookTrigger.MemberPledgeCreated,
    PatreonWebhookTrigger.MemberPledgeDeleted,
    PatreonWebhookTrigger.MemberUpdated,
]

/**
 *
 * @param env
 * @param campaign
 * @param id
 * @param action
 * @param roles
 */
async function manageRoles (env: Config.Env, campaign: Config.CampaignConfig, id: string, action: 'add' | 'remove', roles: string[]) {
    if (roles.length === 0) return false

    for (const role of roles) {
        await makeDiscordRequest({
            env,
            method: action === 'add' ? 'PUT' : 'DELETE',
            reason: action === 'add'
                ? campaign.guild_roles?.reason_add
                : campaign.guild_roles?.reason_remove,
            bot: {
                path: Routes.guildMemberRole(campaign.guild_id, id, role),
            },
        })
    }

    return true
}

/**
 *
 * @param options
 */
export async function updateGuildRoles (options: Options) {
    const { config, env, member: { relationships, attributes, id: memberId }, trigger } = options

    if (!config.guild_roles) return
    const storage = getStorage(config, env)
    if (!storage) return

    const stored = await storage.fetchItem(memberId)
    if (!stored) return
    const roles = config.guild_roles

    if (trigger === PatreonWebhookTrigger.MemberPledgeCreated) {
        let added_roles: string[] = []

        const memberRoles = roles.roles.filter(role => {
            if (attributes.last_charge_status === 'Paid' || (role.allow_pending && attributes.last_charge_status === 'Pending')) {
                if (role.tier_id && !relationships.currently_entitled_tiers.data.some(t => t.id === role.tier_id)) return false
                return true
            }

            return false
        })

        const newRoles = memberRoles.map(r => r.id).filter(r => !stored.discord_roles.includes(r))
        const added = await manageRoles(env, config, stored.discord_id, 'add', newRoles)
        if (added) added_roles = newRoles

        await storage.edit(memberId, {
            follower: attributes.is_follower,
            active_patron: attributes.patron_status === 'active_patron',
            tiers: relationships.currently_entitled_tiers.data.map(t => t.id),
            last_charge: attributes.last_charge_status != null && ['Paid', 'Pending'].includes(attributes.last_charge_status)
                ? <'Paid' | 'Pending'>attributes.last_charge_status
                : undefined,
            discord_roles: stored.discord_roles.concat(added_roles),
            until: null,
        })
    } else if (trigger === PatreonWebhookTrigger.MemberUpdated) {
        let is_deleted = false, added_roles: string[] = []

        if (attributes.last_charge_status === 'Paid') {
            if (stored.last_charge === 'Pending') {
                const memberRoles = roles.roles.filter(role => {
                    if (!role.allow_pending) {
                        if (role.tier_id && !relationships.currently_entitled_tiers.data.some(t => t.id === role.tier_id)) return false
                        return true
                    }

                    return false
                })

                const newRoles = memberRoles.map(r => r.id).filter(r => !stored.discord_roles.includes(r))
                const added = await manageRoles(env, config, stored.discord_id, 'add', newRoles)
                if (added) added_roles = newRoles
            }
        } else if (attributes.last_charge_status !== 'Pending') {
            await storage.deleteItem(memberId)
            is_deleted = true

            await manageRoles(env, config, stored.discord_id, 'remove', stored.discord_roles)
        }

        if (!is_deleted) {
            await storage.edit(memberId, {
                follower: attributes.is_follower,
                active_patron: attributes.patron_status === 'active_patron',
                tiers: relationships.currently_entitled_tiers.data.map(t => t.id),
                last_charge: attributes.last_charge_status != null && ['Paid', 'Pending'].includes(attributes.last_charge_status)
                    ? <'Paid' | 'Pending'>attributes.last_charge_status
                    : undefined,
                discord_roles: stored.discord_roles.concat(added_roles),
            })
        }
    } else if (trigger === PatreonWebhookTrigger.MemberPledgeDeleted) {
        if (attributes.next_charge_date) await storage.edit(memberId, {
            until: attributes.next_charge_date,
        })
    }
}

/**
 *
 * @param config
 * @param env
 */
export async function checkGuildMembers (config: Config.CampaignConfig, env: Config.Env) {
    const storage = getStorage(config, env)
    if (!storage) return

    const members = await storage.fetchItems()

    for (const member of members) {
        if (member.until != null) {
            // Remove access of member at until date
        }
    }
}