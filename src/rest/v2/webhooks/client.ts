import { AttributeItem, DataItem, PostWebhookBody, Relationship, Type, Webhook } from "../../../schemas/v2";

import { Oauth2Routes, } from "../oauth2";
import { createQuery } from "../query";

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
            body: JSON.stringify(body),
        }) as unknown as APIPostWebhookResponse | undefined
    }

    public fetchWebhooks () {}

    public editWebhook () {}

    public pauseWebhook () {}

    public unpauseWebhook () {}
}