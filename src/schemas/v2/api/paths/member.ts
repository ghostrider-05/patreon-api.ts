import {
    Routes,
    PatreonOauthScope,
    RequestMethod,
    Type,
} from '../../../../v2'
import type { Route } from '../types'

const resource = Type.Member
const tags = [
    'Resources',
]

export default [
    {
        route: Routes.campaignMembers,
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
        scopes: [
            PatreonOauthScope.CampaignMembers,
        ],
    },
    {
        route: Routes.member,
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
        },
        scopes: [
            PatreonOauthScope.CampaignMembers,
        ],
    },
] satisfies Route[]
