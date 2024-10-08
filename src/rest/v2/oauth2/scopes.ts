import { createQuery, type BasePatreonQuery } from '../query'
import { Oauth2Routes } from './routes'

export enum PatreonOauthScope {
    Identity = 'identity',
    IdentityEmail = 'identity[email]',
    IdentityMemberships = 'identity.memberships',
    Campaigns = 'campaigns',
    CampaignMembers = 'campaigns.members',
    CampaignMembersEmail = 'campaigns.members[email]',
    CampaignMembersAdress = 'campaigns.members.address',
    CampaignPosts = 'campaigns.posts',
    ManageCampaignWebhooks = 'w:campaigns.webhook'
}

// eslint-disable-next-line jsdoc/require-jsdoc
function getRequiredScopesForPath (
    path: string,
    query: BasePatreonQuery,
): PatreonOauthScope[] {
    const scopes: PatreonOauthScope[] = []

    if (path.startsWith(Oauth2Routes.post('')) || path.endsWith('/posts')) {
        scopes.push(PatreonOauthScope.CampaignPosts)
    } else if (path.startsWith(Oauth2Routes.webhooks())) {
        scopes.push(PatreonOauthScope.ManageCampaignWebhooks)
    } else if (path.startsWith(Oauth2Routes.identity())) {
        scopes.push(PatreonOauthScope.Identity)

        if (query.params.get(encodeURIComponent('fields[user]'))?.includes('email')) {
            scopes.push(PatreonOauthScope.IdentityEmail)
        }

        if (query.params.get('include')?.includes('campaign')) {
            scopes.push(PatreonOauthScope.Campaigns)
        }
    } else if (path.endsWith('/members') || path.startsWith(Oauth2Routes.member(''))) {
        scopes.push(PatreonOauthScope.CampaignMembers)

        if (query.params.get(encodeURIComponent('fields[user]'))?.includes('email')) {
            scopes.push(PatreonOauthScope.CampaignMembersEmail)
        }

        if (query.params.get('include')?.includes('address')) {
            scopes.push(PatreonOauthScope.CampaignMembersAdress)
        }
    } else if (path.startsWith(Oauth2Routes.campaigns())) {
        scopes.push(PatreonOauthScope.Campaigns)
    }

    return scopes
}


// eslint-disable-next-line jsdoc/require-jsdoc
function getRequiredScopesForAttributes (
    requiredAttributes: {
        userEmail?: boolean
        userOwnCampaign?: boolean
        userMemberships?: 'all' | 'client'
        memberEmail?: boolean
        memberAddress?: boolean
    },
    ...routes: (keyof typeof Oauth2Routes)[]
) {
    const scopes: PatreonOauthScope[] = []

    const routeScopes = routes.map(route => {
        const query = new URLSearchParams()
        const attrs = requiredAttributes

        if (route === 'identity') {
            if (attrs.userEmail) query.set('fields[user]', 'email')
            if (attrs.userMemberships === 'all') {
                scopes.push(PatreonOauthScope.IdentityMemberships)
            }

            if (attrs.userMemberships === 'client' || attrs.userOwnCampaign) {
                query.set('include', 'campaign')
            }
        } else if (route === 'member' || route === 'campaignMembers') {
            if (attrs.memberAddress) query.set('include', 'address')
            if (attrs.memberEmail) query.set('fields[user]', 'email')
        }

        return {
            path: Oauth2Routes[route](''),
            query: createQuery(query),
        }
    })

    return scopes.concat(...routeScopes.map(({ path, query }) => getRequiredScopesForPath(path, query)))
}

/**
 * Get the Oauth scopes that are required for a certain path or for multiple paths with certain attributes
 */
export const getRequiredScopes = {
    forPath: getRequiredScopesForPath,
    forAttributes: getRequiredScopesForAttributes,
}
