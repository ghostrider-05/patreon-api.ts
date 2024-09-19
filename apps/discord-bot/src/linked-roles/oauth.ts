import { PatreonOauthScope, PatreonUserClient, StoredToken } from "../../../../dist/index.mjs";
import { fetchOauthMemberships } from "../patreon/member";
import { defaultLinkedRolesData } from "./default";

function getAttributes (config: Config.LinkedRolesConfig) {
    const attributes = (config.data ?? defaultLinkedRolesData).map(item => item.attribute)

    return {
        user: attributes.filter(t => t.resource === 'user').map(t => t.key),
        member: attributes.filter(t => t.resource === 'member').map(t => t.key),
    }
}

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

async function storeOauthToken (token: StoredToken) {

}

async function handleLinkedRolesCallback (env: Config.Env, request: Request) {
    if (!env.linked_roles) {
        throw new Error('No linked roles configured')
    }

    const client = new PatreonUserClient({
        oauth: {
            clientId: env.PATREON_CLIENT_ID,
            clientSecret: env.PATREON_CLIENT_SECRET,
        },
    })

    const token = await client.fetchToken(request)
    if (!token) throw new Error()

    const member = await fetchOauthMemberships(client, {
        token: token.access_token,
        attributes: getAttributes(env.linked_roles),
    })

    await storeOauthToken(token)


}


