import { APIVersion } from './version'

export const RouteBases = {
    oauth2: `https://patreon.com/api/oauth2/v${APIVersion}`,
} as const
