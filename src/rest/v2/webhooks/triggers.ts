export enum PatreonWebhookTrigger {
    /**
     * Triggered when a new member is created.
     * Note that you may get more than one of these per patron if they delete and renew their membership.
     * Member creation only occurs if there was no prior payment between patron and creator.
     */
    MemberCreated = 'members:create',

    /**
     * Triggered when the membership information is changed.
     * Includes updates on payment charging events.
     */
    MemberUpdated = 'members:update',

    /**
     * Triggered when a membership is deleted.
     * Note that you may get more than one of these per patron if they delete and renew their membership.
     * Deletion only occurs if no prior payment happened, otherwise pledge deletion is an update to member status.
     */
    MemberDeleted = 'members:delete',

    /**
     * Triggered when a new pledge is created for a member.
     * This includes when a member is created through pledging, and when a follower becomes a patron.
     */
    MemberPledgeCreated = 'members:pledge:create',

    /**
     * Triggered when a member updates their pledge.
     */
    MemberPledgeUpdated = 'members:pledge:update',

    /**
     * Triggered when a member deletes their pledge.
     */
    MemberPledgeDeleted = 'members:pledge:delete',

    /**
     * Triggered when a post is published on a campaign.
     */
    PostPublished = 'posts:publish',

    /**
     * Triggered when a post is updated on a campaign.
     */
    PostUpdated = 'posts:update',

    /**
     * Triggered when a post is deleted on a campaign.
     */
    PostDeleted = 'posts:delete',
}

export type PatreonWebhookMemberTrigger =
    | PatreonWebhookTrigger.MemberCreated
    | PatreonWebhookTrigger.MemberUpdated
    | PatreonWebhookTrigger.MemberDeleted

export type PatreonWebhookPledgeTrigger =
    | PatreonWebhookTrigger.MemberPledgeCreated
    | PatreonWebhookTrigger.MemberPledgeUpdated
    | PatreonWebhookTrigger.MemberPledgeDeleted

export type PatreonWebhookPostTrigger =
    | PatreonWebhookTrigger.PostPublished
    | PatreonWebhookTrigger.PostUpdated
    | PatreonWebhookTrigger.PostDeleted
