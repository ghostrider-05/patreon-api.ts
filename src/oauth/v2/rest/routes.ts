import { APIVersion } from './version'

export const RouteBases = {
    oauth2: `https://www.patreon.com/api/oauth2/v${APIVersion}`,
} as const
