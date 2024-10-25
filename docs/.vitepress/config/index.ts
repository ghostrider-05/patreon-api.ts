import { DefaultTheme, defineConfig } from 'vitepress'

import { useSidebar } from 'vitepress-openapi'

import * as shared from './shared'

import { fetchOpenAPISchema, openAPIUrlV2 } from '../theme/openapi'

import {
    author,
    bugs,
    description,
    license,
    name,
    repository,
    version,
} from '../../../package.json'

const repoUrl = repository.url.replace('.git', ''), branch = 'main'

const createSidebarItems = () => [
    shared.createGuideItem(true),
    shared.createLinksItem({
        branch,
        bugsUrl: bugs.url,
        repoUrl,
        version,
    }),
] as DefaultTheme.SidebarItem[]

export default defineConfig({
    title: name,
    description,

    cleanUrls: true,
    lastUpdated: true,

    vite: {
        ssr: {
            noExternal: [ /\.css$/, /^vuetify/ ],
        },
    },

    themeConfig: {
        nav: [
            shared.createGuideItem(false),
            { text: 'API', link: '/api/index.html', activeMatch: '/api/' },
            shared.createLinksItem({
                branch,
                bugsUrl: bugs.url,
                repoUrl,
                version,
            }),
            {
                component: 'GitHubStat',
                props: {
                    label: 'GitHub stars',
                    iconClass: 'vpi-social-github',
                    repo: 'ghostrider-05/patreon-api.ts',
                    keyName: 'stargazers_count',
                },
            },
        ] as DefaultTheme.NavItem[],
        sidebar: {
            '/guide/': createSidebarItems(),
            '/apps/': createSidebarItems(),
            '/api/': [
                {
                    text: 'Patreon API',
                    items: [
                        {
                            text: 'OpenAPI schema',
                            link: openAPIUrlV2('openapi-schema'),
                            target: '_blank',
                        },
                        {
                            text: 'Overview',
                            link: '/api/',
                        },
                        ...useSidebar({
                            spec: await fetchOpenAPISchema('openapi-schema'),
                            linkPrefix: '/api/',
                        }).generateSidebarGroups(),
                    ]
                }
            ]
        },

        externalLinkIcon: true,
        editLink: {
            text: 'Edit this page on GitHub',
            pattern: `${repoUrl}/edit/${branch}/docs/:path`,
        },
        socialLinks: [
            {
                icon: 'github',
                link: repoUrl,
            },
        ],

        outline: 'deep',
        search: {
            provider: 'local',
        },

        footer: {
            message: `Released under <a href="${repoUrl}/blob/${branch}/LICENSE">the ${license} License</a>.`,
            copyright: `Copyright © 2024 - present | ${author.name}`,
        },
    },
})
