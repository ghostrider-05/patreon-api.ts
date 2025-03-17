const Address = ['addressee', 'city', 'country', 'created_at', 'line_1', 'line_2', 'phone_number', 'postal_code', 'state'] as const
const Benefit = ['app_external_id', 'app_meta', 'benefit_type', 'created_at', 'deliverables_due_today_count', 'delivered_deliverables_count', 'description', 'is_deleted', 'is_ended', 'is_published', 'next_deliverable_due_date', 'not_delivered_deliverables_count', 'rule_type', 'tiers_count', 'title'] as const
const Campaign = ['vanity', 'url', 'thanks_video_url', 'thanks_msg', 'thanks_embed', 'summary', 'show_earnings', 'rss_feed_title', 'rss_artwork_url', 'published_at', 'pledge_url', 'pay_per_name', 'patron_count', 'one_liner', 'main_video_url', 'main_video_embed', 'is_nsfw', 'is_monthly', 'is_charged_immediately', 'image_url', 'image_small_url', 'has_sent_rss_notify', 'has_rss', 'google_analytics_id', 'discord_server_id', 'creation_name', 'created_at'] as const
const Deliverable = ['completed_at', 'delivery_status', 'due_at'] as const
const Goal = [] as const
const Media = ['created_at', 'download_url', 'file_name', 'image_urls', 'metadata', 'mimetype', 'owner_id', 'owner_relationship', 'owner_type', 'size_bytes', 'state', 'upload_expires_at', 'upload_parameters', 'upload_url'] as const
const Member = ['campaign_lifetime_support_cents', 'currently_entitled_amount_cents', 'email', 'full_name', 'is_follower', 'is_free_trial', 'is_gifted', 'last_charge_date', 'last_charge_status', 'lifetime_support_cents', 'next_charge_date', 'note', 'patron_status', 'pledge_cadence', 'pledge_relationship_start', 'will_pay_amount_cents'] as const
const OauthClient = ['author_name', 'category', 'client_secret', 'default_scopes', 'description', 'domain', 'icon_url', 'name', 'privacy_policy_url', 'redirect_uris', 'tos_url', 'version'] as const
const PledgeEvent = ['amount_cents', 'currency_code', 'date', 'pledge_payment_status', 'payment_status', 'tier_id', 'tier_title', 'type'] as const
const Post = ['app_id', 'app_status', 'content', 'embed_data', 'embed_url', 'is_paid', 'is_public', 'published_at', 'tiers', 'title', 'url'] as const
const Tier = ['amount_cents', 'created_at', 'description', 'discord_role_ids', 'edited_at', 'image_url', 'patron_count', 'post_count', 'published', 'published_at', 'remaining', 'requires_shipping', 'title', 'unpublished_at', 'url', 'user_limit'] as const
const User = ['about', 'can_see_nsfw', 'created', 'email', 'first_name', 'full_name', 'hide_pledges', 'image_url', 'is_creator', 'is_email_verified', 'last_name', 'like_count', 'social_connections', 'thumb_url', 'url', 'vanity'] as const
const Webhook = ['last_attempted_at', 'num_consecutive_times_failed', 'paused', 'secret', 'triggers', 'uri'] as const
/** @deprecated */
export const SchemaKeys = { Address, Benefit, Campaign, Deliverable, Goal, Media, Member, OauthClient, PledgeEvent, Post, Tier, User, Webhook }
