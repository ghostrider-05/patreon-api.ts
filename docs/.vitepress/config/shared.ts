/* eslint-disable jsdoc/require-jsdoc */

type SharedItem = {
    text: string
    activeMatch?: string
} & ({ link: string } | { items: SharedItem[] } )

export function createAppsItem (): SharedItem {
    return {
        text: 'Apps',
        items: [
            {
                text: 'Member dashboard',
                link: '/apps/dashboard',
            },
            {
                text: 'Discord bot',
                link: '/apps/bot',
            },
            {
                text: 'Webhook',
                link: '/apps/webhooks',
            },
        ]
    }
}

export function createLinksItem (version: string): SharedItem {
    return {
        text: version,
        items: [
            {
                text: 'Changelog',
                link: 'https://github.com/ghostrider-05/patreon-api.ts/blob/main/CHANGELOG.md',
            },
            {
                text: 'Roadmap',
                link: 'https://github.com/users/ghostrider-05/projects/5',
            },
            {
                text: 'Contribute',
                items: [
                    {
                        text: 'Donate',
                        link: 'https://paypal.me/05ghostrider'
                    },
                    {
                        text: 'Contributing guide',
                        link: 'https://github.com/ghostrider-05/patreon-api.ts/blob/main/CONTRIBUTING.md'
                    },
                ]
            }
        ]
    }
}

export function createPlaygroundItem (withHeader = false): SharedItem {
    const base: SharedItem = {
        text: 'Playground',
        link: '/guide/playground',
    }

    return withHeader ? { text: 'Interactive', items: [base] } : base
}

export function createGuideItem (expandFeatures = false): SharedItem {
    const features: SharedItem[] = [
        {
            text: 'Overview',
            link: '/guide/features/',
        },
        {
            text: 'Oauth',
            link: '/guide/features/oauth',
        },
        {
            text: 'Sandbox',
            link: '/guide/features/sandbox',
        },
        {
            text: 'Simplify',
            link: '/guide/features/simplify',
        },
        {
            text: 'Webhooks',
            link: '/guide/features/webhooks',
        },
    ]

    return {
        text: 'Guide',
        items: [
            {
                text: 'Introduction',
                link: '/guide/introduction'
            },
            {
                text: 'Installation',
                link: '/guide/installation'
            },
            {
                text: 'Configuration',
                link: '/guide/configuration'
            },
            {
                text: 'Features',
                ...{ ...(expandFeatures ? { items: features, collapsed: false } : { link: '/guide/features/' }) },
            },
        ]
    }
}
