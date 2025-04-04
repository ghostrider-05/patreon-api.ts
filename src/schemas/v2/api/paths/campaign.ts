import {
    Routes,
    PatreonOauthScope,
    RequestMethod,
} from '../../../../rest/v2/'

import { Type } from '../../item'
import type { Route } from '../types'

const resource = Type.Campaign
const tags = [
    'Resources',
]

export default [
    {
        route: Routes.campaign,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Get,
                id: <const>'getCampaign',
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
        route: Routes.campaigns,
        resource,
        tags,
        methods: [
            {
                method: RequestMethod.Get,
                id: <const>'getCampaigns',
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
