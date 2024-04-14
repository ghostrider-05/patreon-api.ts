export enum PatreonScope {
    Identity = 'identity',
    IdentityEmail = 'identity[email]',
    IdentityMemberships = 'identity.memberships',
    Campaigns = 'campaigns',
    CampaignMembers = 'campaigns.members',
    CampaignMembersEmail = 'campaigns.members[email]',
    CampaignMembersAdress = 'campaigns.members.address',
    CampaignPosts = 'campaigns.posts',
    ManageCampaignWebhooks = 'w:campaigns.webhook'
}