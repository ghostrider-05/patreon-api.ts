import {
    Oauth2Routes,
    PatreonOauthScope,
    RequestMethod,
    Type,
} from '../../../../v2'
import type { Route } from '../types'

const resource = Type.Campaign
const tags = [
    'Resources',
]

export default [
    {
        route: Oauth2Routes.campaign,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Get,
                id: 'getCampaign',
            },
        ],
        params: {
            id: 'campaign_id',
        },
        scopes: [
            PatreonOauthScope.Campaigns,
        ],
    },
    {
        route: Oauth2Routes.campaigns,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Get,
                id: 'getCampaigns',
            },
        ],
        response: {
            array: true,
        },
        scopes: [
            PatreonOauthScope.Campaigns,
        ],
    },
] satisfies Route[]
