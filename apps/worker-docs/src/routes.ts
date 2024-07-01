import {
    Oauth2Routes,
    Type,
} from 'patreon-api.ts'

import type { Route } from '../../../docs/.vitepress/components/data'

const id = ':id'

export default [
    {
        route: Oauth2Routes.campaign(id),
        relationship_type: 'campaign',
        requires_id: true,
    },
    {
        route: Oauth2Routes.campaignMembers(id),
        relationship_type: Type.Member,
        list: true,
    },
    {
        route: Oauth2Routes.campaignPosts(id),
        relationship_type: Type.Post,
        list: true,
        requires_id: true,
    },
    {
        route: Oauth2Routes.campaigns(),
        relationship_type: Type.Campaign,
        list: true,
    },
    {
        route: Oauth2Routes.identity(),
        relationship_type: Type.User,
    },
    {
        route: Oauth2Routes.member(id),
        relationship_type: Type.Member,
        requires_id: true,
    },
    {
        route: Oauth2Routes.post(id),
        relationship_type: Type.Post,
    },
    {
        route: Oauth2Routes.webhook(id),
        relationship_type: Type.Webhook,
        requires_id: true,
    },
    {
        route: Oauth2Routes.webhooks(),
        relationship_type: Type.Webhook,
        list: true,
    },
] satisfies Route[]