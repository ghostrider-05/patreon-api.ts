import type {
    Member,
    PatreonWebhookTrigger,
    User,
} from 'patreon-api.ts'

import type {
    APIApplicationRoleConnectionMetadata,
    APIButtonComponentWithURL,
} from 'discord-api-types/v10'

declare global {
	namespace Config {
		type WebhookTrigger = PatreonWebhookTrigger

		interface Binding<Type extends string> {
			env_name: string
			env_type?: Type
		}

		interface DiscordWebhookConfig {
			/**
			 * Whether to use this webhook if a bot scope is present
			 * @default false
			 */
			use_webhook?: boolean
			/**
			 * The secret variable name for the Discord webhook url
			 */
			url_secret_name: string
			/**
			 * Specify if the webhook is owned by app and can send components
			 * @default false
			 */
			is_app_owned?: boolean

			username?: string
			avatar_url?: string
		}

		interface WebhookMessageConfig {
			channel_id: string;
			channel_type: number;

			/**
			 * Whether to send a message if a resource (post, pledge or member) is deleted
			 * @default false
			 */
			send_deleted_event_message?: boolean
			/**
			 * Whether to send a message if a resource (post, pledge or member) is deleted
			 * @default false
			 */
			send_edited_event_message?: boolean

			/**
			 * @default 'message'
			 */
			format_type?: 'embed' | 'message'
			embed_color?: number
			embed_footer?: string

			title?: string
			description?: string
			/**
			 * (If no bot is used) The Discord webhook to send the message from
			 */
			discord_webhook?: DiscordWebhookConfig

			/**
			 * Additional settings for posts webhook messages.
			 * Some options that are only for published posts are in {@link published_posts}.
			 */
			posts?: WebhookMessagePostConfig

			/**
			 * Additional settings for the `posts:published` messages.
			 */
			published_posts?: WebhookMessagePublishedPostConfig
		}

		interface WebhookMessagePublishedPostConfig {
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

		interface WebhookMessagePostConfig {
			edit_original_message?: boolean
			edit_audit_log_reason?: string
			// Does not delete post edited messages, if edit_original_message is not enabled
			delete_original_message?: boolean
			delete_edit_messages?: boolean
			delete_audit_log_reason?: string

			/** @default 'kv' */
			message_storage?: Binding<'kv'> | Binding<'d1'>

			buttons?: APIButtonComponentWithURL[]

			only_public_posts?: boolean
			only_paid_posts?: boolean
			required_tiers?: string[]

			embed_url_to_post?: boolean
			embed_post_media?: boolean
		}

		interface WebhookConfig extends WebhookMessageConfig {
			/**
			 * Specify *all* triggers that this webhook handles
			 */
			triggers: WebhookTrigger[]

			path?: string
			secret_name?: string
		}

		interface GuildRolesConfig {
			// TODO: look if kv can be added
			/** @default 'd1' */
			storage: Binding<'d1'>

			// remove_role_cron?: boolean
			roles: GuildRoleConfig[]

			reason_add?: string
			reason_remove?: string
		}

		interface GuildRoleConfig {
			/**
			 * The id of the Discord role to grant.
			 * Not allowed to be the default / @ everyone role.
			 */
			id: string

			/**
			 * The required (id of) tier a user must have for this Discord role.
			 */
			tier_id?: string
			/**
			 * Whether users with a pending charge status are allowed the role.
			 * If the charge has failed, the role will be removed if
			 * @default true
			 */
			allow_pending?: boolean

			/**
			 * When registering this bot, the bot will register this role.
			 *
			 * When a role is managed by an integration, you cannot manually manage members of this role!
			 * Set {@link id} to an empty string when this is enabled and edit the id after registration by getting the id in Discord.
			 */
			managed_by_integration?: {
				name: string
				color?: number
				hoist?: boolean
			}
		}

		interface CampaignConfig {
			id: string
			guild: {
				id: string
				roles?: GuildRolesConfig
			}
			webhook?: WebhookConfig & { [T in WebhookTrigger]?: WebhookMessageConfig }
		}

		interface LinkedRolesConfig {
			campaign: string
			platform_name?: string
			platform_username?: string

			data?: LinkedRolesItem[]
		}

		interface LinkedRolesItem {
			metadata: APIApplicationRoleConnectionMetadata
			attribute: LinkedRolesAttributeConfig
		}

		// TODO update match to allow oneOf, equals, etc.
		type LinkedRolesAttributeConfig =
			| { resource: 'user', key: keyof User, required_match?: User[keyof User] }
			| { resource: 'member', key: keyof Member, required_match?: Member[keyof Member] }

		interface LinkedRolesDefaultUserMetadata {
			active_patron: boolean
			verified_email: boolean
			campaign_lifetime_cents: number
			entitled_cents: number
		}

		interface UrlConfig {
			patreon?: string
			discord_server?: string

			github?: string
			privacy?: string
			terms_of_service?: string
		}

		interface AppCommandsOptions {
			guilds?: string[]
			register_global: boolean
		}

		interface AppConfig {
			id: string
			public_key: string

			description?: string
			tags?: string[]
			installation_custom_url?: string
			/**
			 * If no custom url is specified, use the in app installation
			 * @default true
			 */
			in_app_installation?: boolean
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
			worker_url: string
			urls?: UrlConfig

			use_bot_scope: boolean
			use_app_commands_scope: boolean

			app_config: AppConfig
			app_commands?: AppCommandsOptions

			campaigns: CampaignConfig[]
			linked_roles?: LinkedRolesConfig
		}

		interface Env extends Options, Secrets { }
	}

}

// Used only for schema generation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Vars {
	vars: Config.Options
	$schema: 'schema.json'
}

export { }

