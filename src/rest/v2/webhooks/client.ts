import { type WebhookPayload } from '../../../payloads/v2'
import {
    QueryBuilder,
    Type,
    type AttributeItem,
    type DataItem,
    type PostWebhookBody,
    type Relationship,
    type Webhook,
    type WriteResourcePayload,
    type WriteResourceResponse,
} from '../../../schemas/v2'

import { Routes, RequestMethod, type RestHeaders } from '../oauth2'
import type { PatreonOauthClient } from '../oauth2/client'
import { RestClient } from '../oauth2/rest'

import {
    type BasePatreonQueryType,
    type GetResponsePayload,
} from '../query'

import type { Oauth2RouteOptions } from '../clients/baseMethods'

import { WebhookPayloadClient } from './payload'

export type Oauth2WebhookRouteOptions = Omit<Oauth2RouteOptions, 'body' | 'contentType'>

/** @deprecated */
export type CreateWebhookBody = PostWebhookBody & {
    /**
     * The id of the campaign that this webhook is linked to
     */
    campaignId: string
}

export type WebhookAPICreateBody = WriteResourcePayload<Type.Webhook, RequestMethod.Post>['data']['attributes'] & {
    /**
     * The id of the campaign that this webhook is linked to
     */
    campaignId: string
}

export type WebhookAPICreateResult = WriteResourceResponse<Type.Webhook>

export type WebhookAPIEditBody = WriteResourcePayload<Type.Webhook, RequestMethod.Patch>['data']['attributes'] & {
    /**
     * The id of the webhook to edit
     */
    id: string
}

export type WebhookAPIEditResult = WriteResourceResponse<Type.Webhook>

// Should not have been exported
/** @deprecated */
export type APIPostWebhookBody = Omit<AttributeItem<Type.Webhook, PostWebhookBody>, 'id'>
    & Relationship<Type.Webhook, 'campaign'>

/** @deprecated */
export type APIPostWebhookResponse = DataItem<Type.Webhook, false> & {
    data: {
        attributes: Webhook
    }
}

/**
 * Gets the assiocated user from the webhook request
 * @param payload the webhook parsed body
 * @returns the user id
 * @deprecated use `new WebhookClient.payloads(trigger, payload).userId`
 */
export function getWebhookUserId (payload: WebhookPayload): string {
    return payload.data.relationships.user.data.id
}

export class WebhookClient {
    private static get emptyQuery () {
        return QueryBuilder.fromParams(new URLSearchParams())
    }

    /**
     * The headers that are sent on webhook requests
     */
    public static headers = {
        signature: 'X-Patreon-Signature',
        event: 'X-Patreon-Event',
    } as const

    public static getWebhookHeaders (headers: RestHeaders) {
        const types = <(keyof typeof this.headers)[]>Object.keys(this.headers)
        const resolved = RestClient.resolveHeaders(headers)

        return types.reduce((data, key) => ({
            ...data,
            [key]: resolved[this.headers[key]] ?? null,
        }), {} as Record<keyof typeof this.headers, string | null>)
    }

    public payloads = WebhookPayloadClient

    public constructor (
        public oauth: PatreonOauthClient,
    ) {}

    /**
     * Creates a new webhook owned by this client.
     * @param webhook The webhook data: uri, event triggers and the campaign of the events
     * @param options Request options
     * @returns the API response from Patreon: either the created webhook on success or `undefined` when failed.
     */
    public async createWebhook (
        webhook: WebhookAPICreateBody,
        options?: Oauth2WebhookRouteOptions,
    ): Promise<WriteResourceResponse<Type.Webhook>> {
        const body: WriteResourcePayload<Type.Webhook, RequestMethod.Post> = {
            data: {
                type: Type.Webhook,
                attributes: {
                    uri: webhook.uri,
                    triggers: webhook.triggers,
                },
                relationships: {
                    campaign: {
                        data: {
                            id: webhook.campaignId,
                            type: Type.Campaign,
                        },
                    },
                },
            },
        }

        return await this.oauth.fetch(Routes.webhooks(), WebhookClient.emptyQuery, {
            ...(options ?? {}),
            method: RequestMethod.Post,
            body: JSON.stringify(body),
        // Typecast needed because of empty query
        }) as unknown as WriteResourceResponse<Type.Webhook>
    }

    /**
     * Fetch webhooks created by this client
     * @param query The query to fetch attributes and relationships
     * @param options Request options
     * @returns the webhooks managed by this client
     */
    public async fetchWebhooks<Query extends BasePatreonQueryType<Type.Webhook, true>>(
        query: Query,
        options?: Oauth2WebhookRouteOptions,
    ): Promise<GetResponsePayload<Query>> {
        return await this.oauth.fetch<Query>(Routes.webhooks(), query, options)
    }

    /**
     * Edit the webhook, created by this client, attributes
     * @param webhook The data to edit
     * @param options Request options
     * @returns The updated webhook or `undefined` when failed to update
     */
    public async editWebhook (
        webhook: WebhookAPIEditBody,
        options?: Oauth2WebhookRouteOptions,
    ): Promise<WriteResourceResponse<Type.Webhook>> {
        const { id, ...attributes } = webhook

        const body: WriteResourcePayload<Type.Webhook, RequestMethod.Patch> = {
            data: {
                type: Type.Webhook,
                id,
                attributes,
            }
        }

        return await this.oauth.fetch(Routes.webhook(id), WebhookClient.emptyQuery, {
            ...(options ?? {}),
            method: RequestMethod.Patch,
            body: JSON.stringify(body),
        // Typecast needed because of empty query
        }) as unknown as WriteResourceResponse<Type.Webhook>
    }

    /**
     * EXPERIMENTAL: This endpoint is not documented on https://docs.patreon.com but it should work
     *
     * Issue a bug if something is broken
     *
     * ---
     *
     * Delete a webhook created by this client
     * @param webhookId The webhook id
     * @param options Request options
     * @returns the webhooks managed by this client
     */
    public async deleteWebhook(
        webhookId: string,
        options?: Oauth2WebhookRouteOptions,
    ): Promise<void> {
        await this.oauth.fetch(Routes.webhook(webhookId), WebhookClient.emptyQuery, {
            ...(options ?? {}),
            method: RequestMethod.Delete,
        })
    }

    /**
     * Check if the webhook should be unpaused as events have failed to send.
     *
     * If `true`, you can call {@link unpauseWebhook}.
     * @param webhook The webhook to check for unsent events
     * @returns whether the webhook has failed events that can be resent
     */
    public hasUnsentEvents (webhook: Webhook): boolean {
        return webhook.num_consecutive_times_failed > 0
    }

    /**
     * To temporarily pause events, such as when updating servers or deploying a new version.
     * @param webhookId The webhook to pause events for
     * @param options Request options
     * @returns the updated (paused) webhook
     */
    public async pauseWebhook (
        webhookId: string,
        options?: Oauth2WebhookRouteOptions,
    ) {
        return await this.editWebhook({
            id: webhookId,
            paused: true,
        }, options)
    }

    /**
     * Continue sending events to this webhook.
     * @param webhookId The webhook to unpause events for
     * @param options Request options
     * @returns the updated (unpaused) webhook
     */
    public async unpauseWebhook (
        webhookId: string,
        options?: Oauth2WebhookRouteOptions,
    ) {
        return await this.editWebhook({
            id: webhookId,
            paused: false,
        }, options)
    }
}
