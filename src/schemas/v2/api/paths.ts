import {
    Oauth2Routes,
    RequestMethod,
    Type,
} from '../../../v2'
import { patchWebhookBody, postWebhooksBody } from './body'

interface Route {
    route: (id: string) => string
    relationship_type: Type
    tag: 'Webhooks' | 'Resources'
    list?: true
    requires_id?: true
    id_name?: string
    methods?: (
        | string
        | {
            method: string
            body?: Record<string, unknown>
        }
    )[]
}

/**
 * Create static routes for the API
 * @returns the routes
 */
function createTemplateRoutes () {
    return Object.keys(Oauth2Routes).reduce((routes, key) => {
        const fn = Oauth2Routes[key as keyof typeof Oauth2Routes]

        return {
            ...routes,
            [key]: fn,
        }
    }, {} as Record<keyof typeof Oauth2Routes, (id: string) => string>)
}

const routes = createTemplateRoutes()

export default [
    {
        route: routes.campaigns,
        relationship_type: Type.Campaign,
        list: true,
        tag: 'Resources',
    },
    {
        route: routes.campaign,
        relationship_type: Type.Campaign,
        requires_id: true,
        id_name: 'campaign_id',
        tag: 'Resources',
    },
    {
        route: routes.campaignMembers,
        relationship_type: Type.Member,
        list: true,
        requires_id: true,
        id_name: 'campaign_id',
        tag: 'Resources',
    },
    {
        route: routes.campaignPosts,
        relationship_type: Type.Post,
        list: true,
        requires_id: true,
        id_name: 'campaign_id',
        tag: 'Resources',
    },
    {
        route: routes.identity,
        relationship_type: Type.User,
        tag: 'Resources',
    },
    {
        route: routes.member,
        relationship_type: Type.Member,
        requires_id: true,
        tag: 'Resources',
    },
    {
        route: routes.post,
        relationship_type: Type.Post,
        requires_id: true,
        tag: 'Resources',
    },
    {
        route: routes.webhook,
        relationship_type: Type.Webhook,
        requires_id: true,
        tag: 'Webhooks',
        methods: [
            {
                method: RequestMethod.Patch,
                body: patchWebhookBody,
            },
        ],
    },
    {
        route: routes.webhooks,
        relationship_type: Type.Webhook,
        list: true,
        tag: 'Webhooks',
        methods: [
            RequestMethod.Get,
            {
                method: RequestMethod.Post,
                body: postWebhooksBody,
            },
        ],
    },
] as Route[]
