import {
    Oauth2Routes,
    RequestMethod,
    Type,
} from '../../../../v2'
import type { Route } from '../types/paths'

const resource = Type.Campaign
const tags = [
    'resource',
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
    },
] satisfies Route[]
