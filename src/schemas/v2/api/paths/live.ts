import {
    Routes,
    RequestMethod,
    PatreonOauthScope,
} from '../../../../rest/v2/'

import { Type } from '../../item'
import type { Route } from '../types'

const resource = Type.Live
const tags = [
    'Resources',
]

const createJSONData = (
    type: string,
    attributes: ({ key: string, required?: boolean } & Record<string, unknown>)[],
    withId: boolean,
) => ({
    required: ['data'],
    properties: {
        data: {
            required: [
                'type', 'attributes',
                ...(withId ? ['id'] : []),
            ],
            properties: {
                type: {
                    type: 'string',
                    enum: [type],
                },
                attributes: attributes.reduce<{ required: string[], properties: object }>((data, attribute) => {
                    const { key, required, ...obj } = attribute

                    return {
                        required: data.required.concat(...(required ? [key] : [])),
                        properties: { ...data.properties, [key]: obj },
                    }
                }, { required: [], properties: {} }),
                ...(withId ? {
                    id: {
                        type: 'string',
                    }
                } : {}),
            }
        }
    }
})

const postBody = createJSONData(Type.Live, [
    { key: 'state', required: true, type: 'string' },
    { key: 'title', type: ['string', 'null'] },
    { key: 'description', type: ['string', 'null'] },
    { key: 'scheduled_for', type: ['string', 'null'] },
    { key: 'live_access_rule_ids', type: ['array'], item: { type: 'string' } },
], false)

const patchBody = createJSONData(Type.Live, [
    { key: 'state', required: true, type: 'string' },
], true)

export default [
    {
        route: Routes.live,
        resource,
        tags,
        params: {
            id: 'id',
        },
        methods: [
            {
                method: RequestMethod.Get,
                experimental: true,
                id: <const>'getLive',
                scopes: [
                    PatreonOauthScope.CampaignLives,
                ],
            },
            {
                method: RequestMethod.Delete,
                experimental: true,
                id: <const>'deleteLive',
                responseStatus: 204,
                scopes: [
                    PatreonOauthScope.ManageCampaignLives,
                ],
            },
            {
                method: RequestMethod.Patch,
                experimental: true,
                id: <const>'editLive',
                scopes: [
                    PatreonOauthScope.ManageCampaignLives,
                ],
                body: patchBody,
            },
        ],
    },
    {
        route: Routes.lives,
        resource,
        tags,
        scopes: [
            PatreonOauthScope.ManageCampaignLives,
        ],
        methods: [
            {
                method: RequestMethod.Post,
                experimental: true,
                id: <const>'createLive',
                body: postBody,
            },
        ],
    },
] satisfies Route[]
