import {
    type RESTPutAPICurrentUserApplicationRoleConnectionJSONBody,
    Routes,
} from "discord-api-types/v10";
import {
    Member,
    PatreonOauthScope,
    PatreonUserClient,
    type StoredToken,
} from "patreon-api.ts";

import { makeDiscordRequest } from "../interactions";
import { fetchOauthMemberships } from "../patreon/member";
import { createText } from "../webhook/messages";
import { getAttributes, getLinkedRolesMemberData } from "./data";

export const linkedRolesPath = {
    auth: '/linked-roles/auth',
    callback: '/linked-roles/callback',
}

export function createLinkedRoleRedirect (env: Config.Env): string {
    const client = new PatreonUserClient({
        oauth: {
            clientId: env.PATREON_CLIENT_ID,
            clientSecret: env.PATREON_CLIENT_SECRET,
        }
    })

    return client.oauth.createOauthUri({
        redirectUri: `https://${env.worker_name}.workers.dev${linkedRolesPath.callback}`,
        scopes: [
            PatreonOauthScope.Identity,
            PatreonOauthScope.IdentityMemberships,
        ],
    })
}

export async function handleLinkedRolesCallback (env: Config.Env, request: Request) {
    if (!env.linked_roles) {
        return new Response('No linked roles configured', { status: 500 })
    }

    const client = new PatreonUserClient({
        oauth: {
            clientId: env.PATREON_CLIENT_ID,
            clientSecret: env.PATREON_CLIENT_SECRET,
        },
    })

    const token = await client.fetchToken(request)
    if (!token) {
        return new Response('No access token found on the request', { status: 400 })
    }

    const member = await fetchOauthMemberships(client, {
        token: token.access_token,
        attributes: getAttributes(env.linked_roles),
    })

    await makeDiscordRequest({
        env,
        method: 'PUT',
        bot: {
            path: Routes.userApplicationRoleConnection(env.app_id),
            body: JSON.stringify({
                platform_name: env.linked_roles.platform_name,
                platform_username: createText(env.linked_roles.platform_username, member.data.attributes, 'full_name')
                    .slice(0, 100),
                metadata: getLinkedRolesMemberData(env.linked_roles, member.data.attributes, <never>{}),
            } satisfies RESTPutAPICurrentUserApplicationRoleConnectionJSONBody),
        }
    })

    await storeOauthToken(member.data.id, token)
}

async function storeOauthToken (memberId: string, token: StoredToken) {

}

async function updateLinkedRolesForMember (member: Member) {

}


