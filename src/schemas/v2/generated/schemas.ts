export const Address = {
    resource: <const>'address',
    properties: <const>[
        'addressee',
        'city',
        'country',
        'created_at',
        'line_1',
        'line_2',
        'phone_number',
        'postal_code',
        'state',
    ],
    relationships: <const>[
        {
            resource: 'campaign', name: 'campaigns', type: 'array'
        },
        {
            resource: 'user', name: 'user', type: 'item'
        },
    ],
}
export const Benefit = {
    resource: <const>'benefit',
    properties: <const>[
        'app_external_id',
        'app_meta',
        'benefit_type',
        'created_at',
        'deliverables_due_today_count',
        'delivered_deliverables_count',
        'description',
        'is_deleted',
        'is_ended',
        'is_published',
        'next_deliverable_due_date',
        'not_delivered_deliverables_count',
        'rule_type',
        'tiers_count',
        'title',
    ],
    relationships: <const>[
        {
            resource: 'campaign', name: 'campaign', type: 'array'
        },
        {
            resource: 'deliverable', name: 'deliverable', type: 'array'
        },
        {
            resource: 'tier', name: 'tier', type: 'array'
        },
    ],
}
export const Campaign = {
    resource: <const>'campaign',
    properties: <const>[
        'vanity',
        'url',
        'thanks_video_url',
        'thanks_msg',
        'thanks_embed',
        'summary',
        'show_earnings',
        'rss_feed_title',
        'rss_artwork_url',
        'published_at',
        'pledge_url',
        'pay_per_name',
        'patron_count',
        'one_liner',
        'main_video_url',
        'main_video_embed',
        'is_nsfw',
        'is_monthly',
        'is_charged_immediately',
        'image_url',
        'image_small_url',
        'has_sent_rss_notify',
        'has_rss',
        'google_analytics_id',
        'discord_server_id',
        'creation_name',
        'created_at',
    ],
    relationships: <const>[
        {
            resource: 'benefit', name: 'benefits', type: 'array'
        },
        {
            resource: 'user', name: 'creator', type: 'item'
        },
        {
            resource: 'goal', name: 'goals', type: 'array'
        },
        {
            resource: 'tier', name: 'tiers', type: 'array'
        },
    ],
}
export const Deliverable = {
    resource: <const>'deliverable',
    properties: <const>[
        'completed_at',
        'delivery_status',
        'due_at',
    ],
    relationships: <const>[
        {
            resource: 'benefit', name: 'benefit', type: 'item'
        },
        {
            resource: 'campaign', name: 'campaign', type: 'item'
        },
        {
            resource: 'member', name: 'member', type: 'item'
        },
        {
            resource: 'user', name: 'user', type: 'item'
        },
    ],
}
export const Goal = {
    resource: <const>'goal',
    properties: <const>[
    ],
    relationships: <const>[
        {
            resource: 'campaign', name: 'campaign', type: 'item'
        },
    ],
}
export const Media = {
    resource: <const>'media',
    properties: <const>[
        'created_at',
        'download_url',
        'file_name',
        'image_urls',
        'metadata',
        'mimetype',
        'owner_id',
        'owner_relationship',
        'owner_type',
        'size_bytes',
        'state',
        'upload_expires_at',
        'upload_parameters',
        'upload_url',
    ],
    relationships: <const>[
    ],
}
export const Member = {
    resource: <const>'member',
    properties: <const>[
        'campaign_lifetime_support_cents',
        'currently_entitled_amount_cents',
        'email',
        'full_name',
        'is_follower',
        'is_free_trial',
        'is_gifted',
        'last_charge_date',
        'last_charge_status',
        'lifetime_support_cents',
        'next_charge_date',
        'note',
        'patron_status',
        'pledge_cadence',
        'pledge_relationship_start',
        'will_pay_amount_cents',
    ],
    relationships: <const>[
        {
            resource: 'address', name: 'address', type: 'item'
        },
        {
            resource: 'campaign', name: 'campaign', type: 'item'
        },
        {
            resource: 'tier', name: 'currently_entitled_tiers', type: 'array'
        },
        {
            resource: 'pledge-event', name: 'pledge_history', type: 'array'
        },
        {
            resource: 'user', name: 'user', type: 'item'
        },
    ],
}
export const OauthClient = {
    resource: <const>'client',
    properties: <const>[
        'author_name',
        'category',
        'client_secret',
        'default_scopes',
        'description',
        'domain',
        'icon_url',
        'name',
        'privacy_policy_url',
        'redirect_uris',
        'tos_url',
        'version',
    ],
    relationships: <const>[
        {
            resource: 'campaign', name: 'campaign', type: 'item'
        },
        {
            resource: 'user', name: 'user', type: 'item'
        },
    ],
}
export const PledgeEvent = {
    resource: <const>'pledge-event',
    properties: <const>[
        'amount_cents',
        'currency_code',
        'date',
        'pledge_payment_status',
        'payment_status',
        'tier_id',
        'tier_title',
        'type',
    ],
    relationships: <const>[
        {
            resource: 'campaign', name: 'campaign', type: 'item'
        },
        {
            resource: 'user', name: 'patron', type: 'item'
        },
        {
            resource: 'tier', name: 'tier', type: 'item'
        },
    ],
}
export const Post = {
    resource: <const>'post',
    properties: <const>[
        'app_id',
        'app_status',
        'content',
        'embed_data',
        'embed_url',
        'is_paid',
        'is_public',
        'published_at',
        'tiers',
        'title',
        'url',
    ],
    relationships: <const>[
        {
            resource: 'user', name: 'user', type: 'item'
        },
        {
            resource: 'campaign', name: 'campaign', type: 'item'
        },
    ],
}
export const Tier = {
    resource: <const>'tier',
    properties: <const>[
        'amount_cents',
        'created_at',
        'description',
        'discord_role_ids',
        'edited_at',
        'image_url',
        'patron_count',
        'post_count',
        'published',
        'published_at',
        'remaining',
        'requires_shipping',
        'title',
        'unpublished_at',
        'url',
        'user_limit',
    ],
    relationships: <const>[
        {
            resource: 'benefit', name: 'benefits', type: 'array'
        },
        {
            resource: 'campaign', name: 'campaign', type: 'item'
        },
        {
            resource: 'media', name: 'tier_image', type: 'item'
        },
    ],
}
export const User = {
    resource: <const>'user',
    properties: <const>[
        'about',
        'can_see_nsfw',
        'created',
        'email',
        'first_name',
        'full_name',
        'hide_pledges',
        'image_url',
        'is_creator',
        'is_email_verified',
        'last_name',
        'like_count',
        'social_connections',
        'thumb_url',
        'url',
        'vanity',
    ],
    relationships: <const>[
        {
            resource: 'campaign', name: 'campaign', type: 'item'
        },
        {
            resource: 'member', name: 'memberships', type: 'array'
        },
    ],
}
export const Webhook = {
    resource: <const>'webhook',
    properties: <const>[
        'last_attempted_at',
        'num_consecutive_times_failed',
        'paused',
        'secret',
        'triggers',
        'uri',
    ],
    relationships: <const>[
        {
            resource: 'campaign', name: 'campaign', type: 'item'
        },
        {
            resource: 'client', name: 'client', type: 'item'
        },
    ],
}
