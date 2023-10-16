import { APIVersion } from './version'

export const RouteBases = {
    api: `https://patreon.com/api/v${APIVersion}`,
    oauth2: `https://patreon.com/api/oauth2/v${APIVersion}`,
} as const
