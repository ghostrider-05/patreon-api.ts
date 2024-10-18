export const path = 'https://www.patreon.com/auth/services.json'

interface PatreonService {
    color: string
    connect: string
    disconnect: string
    scopes: Record<'available' | 'default', string[]>
    type: string
}

export type Response = PatreonService[]
