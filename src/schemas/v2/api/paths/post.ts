import {
    Oauth2Routes,
    PatreonOauthScope,
    RequestMethod,
    Type,
} from '../../../../v2'
import type { Route } from '../../../../utils/openapi'

const resource = Type.Post
const tags = [
    'Resources',
]

export default [
    {
        route: Oauth2Routes.campaignPosts,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Get,
                id: 'getCampaignPosts',
            },
        ],
        params: {
            id: 'campaign_id',
        },
        response: {
            array: true,
        },
        scopes: [
            PatreonOauthScope.CampaignPosts,
        ],
    },
    {
        route: Oauth2Routes.post,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Get,
                id: 'getPost',
            },
        ],
        params: {
            id: 'id',
        },
        scopes: [
            PatreonOauthScope.CampaignPosts,
        ],
    },
] satisfies Route[]
