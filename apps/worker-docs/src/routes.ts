import {
    Oauth2Routes,
    PatreonWebhookTrigger,
    Type,
} from 'patreon-api.ts'

import type { Route, RouteBodyKey } from '../../../docs/.vitepress/components/data'

/**
 * Create static routes for the API
 * @param param The param for the id in every route
 * @returns the routes
 */
function createTemplateRoutes (param: string) {
    return Object.keys(Oauth2Routes).reduce((routes, key) => {
        const fn = Oauth2Routes[key as keyof typeof Oauth2Routes]

        return {
            ...routes,
            [key]: fn(param),
        }
    }, {} as Record<keyof typeof Oauth2Routes, string>)
}

const routes = createTemplateRoutes(':id')

const webhookBody: RouteBodyKey[] = [
    { key: 'paused', type: 'boolean' },
    { key: 'uri', type: 'string' },
    {
        key: 'triggers',
        type: 'string',
        is_array: true,
        options: Object.values(PatreonWebhookTrigger).map(t => t.toString()),
    }
]

export default [
    {
        route: routes.campaigns,
        relationship_type: Type.Campaign,
        list: true,
    },
    {
        route: routes.campaign,
        relationship_type: 'campaign',
        requires_id: true,
    },
    {
        route: routes.campaignMembers,
        relationship_type: Type.Member,
        list: true,
        requires_id: true,
    },
    {
        route: routes.campaignPosts,
        relationship_type: Type.Post,
        list: true,
        requires_id: true,
    },
    {
        route: routes.identity,
        relationship_type: Type.User,
    },
    {
        route: routes.member,
        relationship_type: Type.Member,
        requires_id: true,
    },
    {
        route: routes.post,
        relationship_type: Type.Post,
        requires_id: true,
    },
    {
        route: routes.webhook,
        relationship_type: Type.Webhook,
        requires_id: true,
        methods: [
            {
                method: 'PATCH',
                body: webhookBody,
            },
        ],
    },
    {
        route: routes.webhooks,
        relationship_type: Type.Webhook,
        list: true,
        methods: [
            'GET',
            {
                method: 'POST',
                body: webhookBody.map(key => ({ ...key, required: true })),
            },
        ],
    },
] satisfies Route[]