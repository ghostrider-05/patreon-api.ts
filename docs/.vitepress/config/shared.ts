/* eslint-disable jsdoc/require-jsdoc */
import type { DefaultTheme } from 'vitepress'

type SharedItem = DefaultTheme.NavItem | DefaultTheme.SidebarItem

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

export function createLinksItem (options: {
    version: string
    repoUrl: string
    bugsUrl: string
    branch: string
}): SharedItem {
    return {
        text: options.version,
        items: [
            {
                text: 'Changelog',
                link: `${options.repoUrl}/blob/${options.branch}/CHANGELOG.md`,
            },
            {
                text: 'Roadmap',
                link: 'https://github.com/users/ghostrider-05/projects/5',
            },
            {
                text: 'Report a bug',
                link: options.bugsUrl,
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
                        link: `${options.repoUrl}/blob/${options.branch}/CONTRIBUTING.md`,
                    },
                ]
            }
        ]
    }
}

export function createGuideItem (expandFeatures = false): SharedItem {
    const features = [
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

    if (!expandFeatures) return {
        text: 'Guide',
        link: '/guide/introduction',
    }

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
                items: features,
                collapsed: false,
            },
        ]
    }
}
