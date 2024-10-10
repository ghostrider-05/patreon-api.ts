import {
    Oauth2Routes,
    RequestMethod,
    Type,
} from '../../../../v2'
import type { Route } from '../types/paths'

const resource = Type.Post
const tags = [
    'resource',
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
            id: null,
        }
    },
] satisfies Route[]
