import type { Member, PatreonWebhookTrigger, User } from 'patreon-api.ts'

import type {
    APIApplicationRoleConnectionMetadata,
    APIButtonComponentWithURL,
} from 'discord-api-types/v10'

declare global {
	namespace Config {
		type WebhookTrigger = PatreonWebhookTrigger

		interface WebhookMessageConfig {
			channel_id: string;
			channel_type: number;

			send_deleted_event_message?: boolean
			send_edited_event_message?: boolean

			app_type?: 'bot' | 'webhook'
			discord_webhook?: {
				url_secret_name: string
				is_app_owned?: boolean

				username?: string
				avatar_url?: string
				// thread_id?: string
			}

			format_type?: 'embed' | 'message'
			embed_color?: number
			embed_footer?: string

			title?: string
			description?: string
			// Only for posts used
			posts?: WebhookMessagePostConfig
		}

		interface WebhookMessagePostConfig {
			edit_original_message?: boolean
			edit_audit_log_reason?: string
			// Does not delete post edited messages, if edit_original_message is not enabled
			delete_original_message?: boolean
			delete_audit_log_reason?: string

			published_posts?: {
				announce_message?: boolean
				create_thread?: boolean

				forum_create_posts?: boolean

				forum_tags?: string[]
				forum_title?: string
				forum_unknown_title?: string

				thread_reason?: string
				thread_auto_archive?: number
				thread_rate_limit?: number
			}

			message_storage_type?: 'kv' | 'd1'
			message_storage_env?: string

			buttons?: APIButtonComponentWithURL[]

			only_public_posts?: boolean
			only_paid_posts?: boolean
			required_tiers?: string[]

			embed_url_to_post?: boolean
			embed_post_media?: boolean
		}

		interface WebhookConfig extends WebhookMessageConfig {
			triggers: WebhookTrigger[]
		}

		interface GuildRolesConfig {
			// TODO: look if kv can be added
			/** @default 'd1' */
			storage_type?: 'd1'
			storage_env: string

			remove_role_cron?: boolean
			roles: GuildRoleConfig[]

			reason_add?: string
			reason_remove?: string
		}

		interface GuildRoleConfig {
			id: string
			tier_id?: string
			/** @default true */
			allow_pending?: boolean
		}

		interface CampaignConfig {
			id: string
			guild_id: string
			guild_roles?: GuildRolesConfig
			webhooks_path?: string
			webhooks_secret_name?: string
			webhooks?: (WebhookConfig & { [T in WebhookTrigger]?: WebhookMessageConfig })[]
		}

		interface LinkedRolesConfig {
			campaign: string
			platform_name?: string
			platform_username?: string

			data?: {
				metadata: APIApplicationRoleConnectionMetadata
				attribute: LinkedRolesAttributeConfig
			}[]
		}

		type LinkedRolesAttributeConfig =
			| { resource: 'user', key: keyof User, required_match?: User[keyof User] }
			| { resource: 'member', key: keyof Member, required_match?: Member[keyof Member] }

		interface LinkedRolesDefaultUserMetadata {
			active_patron: boolean
			verified_email: boolean
			campaign_lifetime_cents: number
			entitled_cents: number
		}

		interface Secrets extends Record<string, unknown> {
			PATREON_ACCESS_TOKEN: string
			PATREON_REFRESH_TOKEN: string
			PATREON_CLIENT_ID: string
			PATREON_CLIENT_SECRET: string

			PATREON_WEBHOOK_SECRET?: string

			DISCORD_CLIENT_SECRET?: string
			DISCORD_BOT_TOKEN?: string
		}

		interface Options {
			worker_name: string;

			app_public_key: string;
			app_id: string;

			github_url?: string
			privacy_url?: string
			tos_url?: string

			use_bot_scope: boolean
			use_app_commands_scope: boolean
			register_global_app_commands: boolean
			app_commands_guilds?: string[]

			campaigns: CampaignConfig[]
			linked_roles?: LinkedRolesConfig
		}

		interface Env extends Options, Secrets { }
	}

}

export { }

