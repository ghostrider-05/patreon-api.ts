import { ApplicationRoleConnectionMetadataType } from 'discord-api-types/v10'

export const defaultLinkedRolesData: NonNullable<Config.LinkedRolesConfig['data']> = [
    {
        metadata: {
            type: ApplicationRoleConnectionMetadataType.BooleanEqual,
            key: 'active_patron' satisfies keyof Config.LinkedRolesDefaultUserMetadata,
            name: 'Active patron',
            description: 'User must be an active patron of the campaign',
        },
        attribute: {
            resource: 'member',
            key: 'patron_status',
            required_match: 'active_patron',
        },
    },
    {
        metadata: {
            type: ApplicationRoleConnectionMetadataType.IntegerEqual,
            key: 'entitled_cents' satisfies keyof Config.LinkedRolesDefaultUserMetadata,
            name: 'Entitled cents',
            description: 'The amount of cents the user is entitled to (tier prize)',
        },
        attribute: {
            resource: 'member',
            key: 'currently_entitled_amount_cents',
        },
    },
    {
        metadata: {
            type: ApplicationRoleConnectionMetadataType.BooleanEqual,
            key: 'campaign_lifetime_cents' satisfies keyof Config.LinkedRolesDefaultUserMetadata,
            name: 'Lifetime paid',
            description: 'The amount of cents paid in total to the campaign',
        },
        attribute: {
            resource: 'member',
            key: 'campaign_lifetime_support_cents',
        },
    },
    {
        metadata: {
            type: ApplicationRoleConnectionMetadataType.BooleanEqual,
            key: 'verified_email' satisfies keyof Config.LinkedRolesDefaultUserMetadata,
            name: 'Verified mail',
            description: 'The user has a verified mail',
        },
        attribute: {
            resource: 'user',
            key: 'is_email_verified',
        },
    },
]
