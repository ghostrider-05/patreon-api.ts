/* eslint-disable jsdoc/require-param */
/* eslint-disable jsdoc/require-returns */
import type { ItemMap } from '../item'
import type { RandomDataGenerator } from '../mock/random'

export default class RandomDataResources {
    public constructor(
        public random: RandomDataGenerator,
        public resources?: Partial<{ [T in keyof ItemMap]: (id: string) => Partial<ItemMap[T]> }>,) {
    }

    address(id: string): ItemMap['address'] {
        return {
            addressee: null,
            city: this.random.city(),
            country: this.random.countryCode(),
            created_at: this.random.pastDate(),
            line_1: null,
            line_2: null,
            phone_number: this.random.phonenumber(),
            postal_code: null,
            state: this.random.state(),
            ...(this.resources?.address?.(id) ?? {}),
        }
    }

    benefit(id: string): ItemMap['benefit'] {
        return {
            app_external_id: null,
            app_meta: null,
            benefit_type: null,
            created_at: this.random.pastDate(),
            deliverables_due_today_count: this.random.number(),
            delivered_deliverables_count: this.random.number(),
            description: this.random.description(),
            is_deleted: this.random.boolean(),
            is_ended: this.random.boolean(),
            is_published: this.random.boolean(),
            next_deliverable_due_date: this.random.futureDate(),
            not_delivered_deliverables_count: this.random.number(),
            rule_type: null,
            tiers_count: this.random.number(),
            title: this.random.title(),
            ...(this.resources?.benefit?.(id) ?? {}),
        }
    }

    campaign(id: string): ItemMap['campaign'] {
        return {
            vanity: null,
            url: this.random.uri(),
            thanks_video_url: this.random.videoUri(),
            thanks_msg: null,
            thanks_embed: null,
            summary: null,
            show_earnings: this.random.boolean(),
            rss_feed_title: null,
            rss_artwork_url: this.random.uri(),
            published_at: this.random.pastDate(),
            pledge_url: '',
            pay_per_name: null,
            patron_count: this.random.number(),
            one_liner: null,
            main_video_url: this.random.videoUri(),
            main_video_embed: null,
            is_nsfw: this.random.boolean(),
            is_monthly: this.random.boolean(),
            is_charged_immediately: this.random.boolean(),
            image_url: this.random.imageUri(),
            image_small_url: this.random.imageUri(),
            has_sent_rss_notify: this.random.boolean(),
            has_rss: this.random.boolean(),
            google_analytics_id: null,
            discord_server_id: null,
            creation_name: null,
            created_at: this.random.pastDate(),
            ...(this.resources?.campaign?.(id) ?? {}),
        }
    }

    deliverable(id: string): ItemMap['deliverable'] {
        return {
            completed_at: this.random.pastDate(),
            delivery_status: this.random.arrayElement(['delivered', 'not_delivered', 'wont_deliver']),
            due_at: this.random.futureDate(),
            ...(this.resources?.deliverable?.(id) ?? {}),
        }
    }

    /** @deprecated */
    goal(id: string): ItemMap['goal'] {
        return {
            ...(this.resources?.goal?.(id) ?? {}),
        }
    }

    media(id: string): ItemMap['media'] {
        return {
            created_at: this.random.pastDate(),
            download_url: this.random.uri(),
            file_name: '',
            image_urls: {},
            metadata: null,
            mimetype: '',
            owner_id: '',
            owner_relationship: '',
            owner_type: '',
            size_bytes: this.random.number(),
            state: this.random.state(),
            upload_expires_at: this.random.futureDate(),
            upload_parameters: {},
            upload_url: this.random.uri(),
            ...(this.resources?.media?.(id) ?? {}),
        }
    }

    member(id: string): ItemMap['member'] {
        return {
            campaign_lifetime_support_cents: this.random.number(),
            currently_entitled_amount_cents: this.random.number(),
            email: this.random.email(),
            full_name: this.random.fullName(),
            /** @deprecated */
            is_follower: this.random.boolean(),
            is_free_trial: this.random.boolean(),
            is_gifted: this.random.boolean(),
            last_charge_date: this.random.futureDate(),
            last_charge_status: this.random.arrayElement([null, 'Paid', 'Declined', 'Deleted', 'Pending', 'Refunded', 'Refunded by Patreon', 'Partially Refunded', 'Fraud', 'Free Trial', 'Other']),
            /** @deprecated */
            lifetime_support_cents: this.random.number(),
            next_charge_date: this.random.futureDate(),
            note: '',
            patron_status: this.random.arrayElement([null, 'active_patron', 'declined_patron', 'former_patron']),
            pledge_cadence: 1,
            pledge_relationship_start: this.random.futureDate(),
            will_pay_amount_cents: 500,
            ...(this.resources?.member?.(id) ?? {}),
        }
    }

    client(id: string): ItemMap['client'] {
        return {
            author_name: null,
            category: '',
            client_secret: '',
            /** @deprecated */
            default_scopes: '',
            description: this.random.description(),
            domain: this.random.uri(),
            icon_url: this.random.uri(),
            name: '',
            privacy_policy_url: this.random.uri(),
            redirect_uris: '',
            tos_url: this.random.uri(),
            version: 2,
            ...(this.resources?.client?.(id) ?? {}),
        }
    }

    'pledge-event'(id: string): ItemMap['pledge-event'] {
        return {
            amount_cents: 500,
            currency_code: this.random.currencyCode(),
            date: this.random.futureDate(),
            pledge_payment_status: this.random.arrayElement(['queued', 'pending', 'valid', 'declined', 'fraud', 'disabled']),
            payment_status: this.random.arrayElement(['Paid', 'Declined', 'Deleted', 'Pending', 'Refunded', 'Refunded by Patreon', 'Partially Refunded', 'Fraud', 'Free Trial', 'Other']),
            tier_id: null,
            tier_title: null,
            type: this.random.arrayElement(['pledge_start', 'pledge_upgrade', 'pledge_downgrade', 'pledge_delete', 'subscription']),
            ...(this.resources?.['pledge-event']?.(id) ?? {}),
        }
    }

    post(id: string): ItemMap['post'] {
        return {
            app_id: null,
            app_status: null,
            content: null,
            embed_data: null,
            embed_url: this.random.uri(),
            is_paid: this.random.arrayElement([null, false, true]),
            is_public: this.random.arrayElement([null, false, true]),
            published_at: this.random.pastDate(),
            tiers: null,
            title: this.random.title(),
            url: this.random.uri(),
            ...(this.resources?.post?.(id) ?? {}),
        }
    }

    tier(id: string): ItemMap['tier'] {
        return {
            amount_cents: this.random.number(),
            created_at: this.random.pastDate(),
            description: this.random.description(),
            discord_role_ids: null,
            edited_at: this.random.pastDate(),
            image_url: this.random.imageUri(),
            patron_count: this.random.number(),
            post_count: this.random.number(),
            published: this.random.boolean(),
            published_at: this.random.pastDate(),
            remaining: null,
            requires_shipping: this.random.boolean(),
            title: this.random.title(),
            unpublished_at: this.random.futureDate(),
            url: this.random.uri(),
            user_limit: null,
            ...(this.resources?.tier?.(id) ?? {}),
        }
    }

    user(id: string): ItemMap['user'] {
        return {
            about: null,
            can_see_nsfw: this.random.arrayElement([null, false, true]),
            created: this.random.pastDate(),
            email: this.random.email(),
            first_name: this.random.firstName(),
            full_name: this.random.fullName(),
            hide_pledges: this.random.arrayElement([null, false, true]),
            image_url: this.random.imageUri(),
            is_creator: this.random.boolean(),
            is_email_verified: this.random.boolean(),
            last_name: this.random.lastName(),
            like_count: this.random.number(),
            social_connections: {},
            thumb_url: this.random.imageUri(),
            url: this.random.uri(),
            /** @deprecated */
            vanity: null,
            ...(this.resources?.user?.(id) ?? {}),
        }
    }

    webhook(id: string): ItemMap['webhook'] {
        return {
            last_attempted_at: this.random.pastDate(),
            num_consecutive_times_failed: 0,
            paused: this.random.boolean(),
            secret: '',
            triggers: [
                'members:pledge:create',
                'members:update',
                'members:pledge:delete',
            ],
            uri: this.random.uri(),
            ...(this.resources?.webhook?.(id) ?? {}),
        }
    }
}
