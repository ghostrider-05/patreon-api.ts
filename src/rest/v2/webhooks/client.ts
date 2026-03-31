import {
    type BasePatreonQueryType,
    type GetResponsePayload,
    Type,
    type Webhook,
    type WriteResourcePayload,
    type WriteResourceResponse,
} from '../../../schemas/v2'

import {
    Routes,
    RequestMethod,
    type RestHeaders,
} from '../oauth2/'
import type { PatreonOauthClient } from '../oauth2/client'
import { resolveHeaders } from '../oauth2/rest/headers'

import { WriteResourceSharedClient, type Oauth2RouteOptions,  } from '../clients/shared'

import { WebhookPayloadClient } from './payload'

export type Oauth2WebhookRouteOptions = Omit<Oauth2RouteOptions, 'body' | 'contentType'>

export type WebhookAPICreateBody = WriteResourcePayload<Type.Webhook, RequestMethod.Post>['data']['attributes'] & {
    [T in `${keyof WriteResourcePayload<Type.Webhook, RequestMethod.Post>['data']['relationships']}Id`]: string
}

export type WebhookAPICreateResult = WriteResourceResponse<Type.Webhook>

export type WebhookAPIEditBody = WriteResourcePayload<Type.Webhook, RequestMethod.Patch>['data']['attributes'] & {
    /**
     * The id of the webhook to edit
     */
    id: string
}

export type WebhookAPIEditResult = WriteResourceResponse<Type.Webhook>

export class WebhookClient {
    /**
     * The headers that are sent on webhook requests
     */
    public static headers = {
        signature: 'X-Patreon-Signature',
        event: 'X-Patreon-Event',
    } as const

    public static getWebhookHeaders (headers: RestHeaders) {
        const types = <(keyof typeof this.headers)[]>Object.keys(this.headers)
        const resolved = resolveHeaders(headers)

        return types.reduce((data, key) => ({
            ...data,
            [key]: resolved[this.headers[key].toLowerCase()] ?? null,
        }), {} as Record<keyof typeof this.headers, string | null>)
    }

    public payloads = WebhookPayloadClient
    private shared: WriteResourceSharedClient<Type.Webhook, undefined>

    public constructor (
        public oauth: PatreonOauthClient,
    ) {
        this.shared = new WriteResourceSharedClient(Type.Webhook, oauth, {
            itemRoute: Routes.webhook,
            listRoute: Routes.webhooks,
        })
    }

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
        const { campaignId, ...attributes } = webhook

        return this.shared.create({
            attributes,
            relationships: {
                campaign: {
                    data: {
                        type: Type.Campaign,
                        id: campaignId,
                    }
                }
            },
        }, options)
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
        return this.shared.fetch(query, options)
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
        return this.shared.edit(webhook, options)
    }

    // TODO: write test
    /**
     * Delete a webhook created by this client
     * @param webhookId The webhook id
     * @param options Request options
     */
    public async deleteWebhook(
        webhookId: string,
        options?: Oauth2WebhookRouteOptions,
    ): Promise<void> {
        await this.shared.delete(webhookId, options)
    }

    // TODO: make static too
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
