export interface OauthClient {
    /**
     * The author name provided during client setup.
     */
    author_name: string | null

    /**
     * The client's secret.
     */
    client_secret: string

    /**
     * The client's default OAuth scopes for the authorization flow.
     * @deprecated
     */
    default_scopes: string

    /**
     * The description provided during client setup.
     */
    description: string

    /**
     * The domain provided during client setup.
     */
    domain: string | null

    /**
     * The URL of the icon used in the OAuth authorization flow.
     */
    icon_url: string | null

    /**
     * The name provided during client setup.
     */
    name: string

    /**
     * The URL of the privacy policy provided during client setup.
     */
    privacy_policy_url: string | null

    /**
     * The allowable redirect URIs for the OAuth authorization flow.
     */
    redirect_uris: string

    /**
     * The URL of the terms of service provided during client setup.
     */
    tos_url: string

    /**
     * The Patreon API version the client is targeting.
     */
    version: number
}