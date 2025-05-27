import { APIVersion } from './version'

export const RouteBases = {
    /** @deprecated This is not used in the API documentation */
    api: `https://patreon.com/api/v${APIVersion}`,
    oauth2: `https://patreon.com/api/oauth2/v${APIVersion}`,
} as const
