import {
    Oauth2Routes,
    RequestMethod,
    Type,
} from '../../../../v2'
import type { Route } from '../../../../utils/openapi'

const resource = Type.Member
const tags = [
    'resource',
]

export default [
    {
        route: Oauth2Routes.campaignMembers,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Get,
                id: 'getCampaignMembers',
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
        route: Oauth2Routes.member,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Get,
                id: 'getMember',
            },
        ],
        params: {
            id: 'id',
        }
    },
] satisfies Route[]
