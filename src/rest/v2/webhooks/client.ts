import {
    Type,
    type AttributeItem,
    type DataItem,
    type PatchWebhookBody,
    type PostWebhookBody,
    type Relationship,
    type Webhook,
} from "../../../schemas/v2";

import { Oauth2Routes } from "../oauth2";
import { createQuery, type BasePatreonQueryType, type GetResponsePayload } from "../query";

import type { Oauth2RouteOptions } from "../clients/baseMethods";
import { PatreonOauthClient } from "../oauth2/client";

export type Oauth2WebhookRouteOptions = Omit<Oauth2RouteOptions, 'body' | 'contentType'>

export type CreateWebhookBody = PostWebhookBody & {
    /**
     * The id of the campaign that this webhook is linked to
     */
    campaignId: string
}

export type APIPostWebhookBody = Omit<AttributeItem<Type.Webhook, PostWebhookBody>, 'id'>
    & Relationship<Type.Webhook, 'campaign'>

export type APIPostWebhookResponse = DataItem<Type.Webhook, false> & {
    data: {
        attributes: Webhook
    }
}

export class WebhookClient {
    /**
     * The headers that are sent on webhook requests
     */
    public static headers = {
        signature: 'X-Patreon-Signature',
        event: 'X-Patreon-Event',
    } as const

    public static getWebhookHeaders (headers: Record<string, string>) {
        const types = <(keyof typeof this.headers)[]>Object.keys(this.headers)

        return types.reduce((data, key) => ({
            ...data,
            [key]: headers[this.headers[key]] ?? null,
        }), {} as Record<keyof typeof this.headers, string | null>)
    }

    public constructor (
        public oauth: PatreonOauthClient,
    ) {}

    /**
     * Creates a new webhook owned by this client.
     * @param webhook The webhook data: uri, event triggers and the campaign of the events
     * @param options Request options
     */
    public async createWebhook (
        webhook: CreateWebhookBody,
        options?: Oauth2WebhookRouteOptions,
    ): Promise<APIPostWebhookResponse | undefined> {
        const body: APIPostWebhookBody = {
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
                    }
                },
            },
        }

        return await PatreonOauthClient.fetch(Oauth2Routes.webhooks(), createQuery(new URLSearchParams()), this.oauth, {
            ...(options ?? {}),
            method: 'POST',
            body: JSON.stringify({ data: body }),
        }) as unknown as APIPostWebhookResponse | undefined
    }

    /**
     * Fetch webhooks created by this client
     * @param query The query to fetch attributes and relationships
     * @param options Request options
     */
    public async fetchWebhooks<Query extends BasePatreonQueryType<Type.Webhook, true>>(
        query: Query,
        options?: Oauth2WebhookRouteOptions,
    ): Promise<GetResponsePayload<Query> | undefined> {
        return await PatreonOauthClient.fetch<Query>(Oauth2Routes.webhooks(), query, this.oauth, options)
    }

    /**
     * Edit the webhook, created by this client, attributes 
     * @param webhook The data to edit
     * @param options Request options
     */
    public async editWebhook (
        webhook: PatchWebhookBody & { id: string },
        options?: Oauth2WebhookRouteOptions,
    ) {
        const { id, ...body } = webhook
    
        return await PatreonOauthClient.fetch(Oauth2Routes.webhooks(), createQuery(new URLSearchParams()), this.oauth, {
            ...(options ?? {}),
            method: 'POST',
            body: JSON.stringify({
                data: {
                    type: Type.Webhook,
                    id: webhook.id,
                    attributes: body,
                },
            }),
        }) as unknown as APIPostWebhookResponse | undefined
    }

    /**
     * Check if the webhook should be unpaused as events have failed to send.
     * 
     * If `true`, you can call {@link unpauseWebhook}.
     * @param webhook The webhook to check for unsent events
     */
    public hasUnsentEvents (webhook: Webhook): boolean {
        return webhook.num_consecutive_times_failed > 0
    }

    /**
     * To temporarily pause events, such as when updating servers or deploying a new version.
     * @param webhookId The webhook to pause events for
     * @param options Request options
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
