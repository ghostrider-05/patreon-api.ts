import { DefaultTheme, defineConfig } from 'vitepress'

import { transformerTwoslash } from '@shikijs/vitepress-twoslash'

import type { GitHubStatsComponentProps } from '../components/GitHubStat.vue'

import * as shared from './shared'

import {
    author,
    bugs,
    description,
    funding,
    license,
    name,
    repository,
    version,
} from '../../../package.json'

import {
    homepage,
} from '../../package.json'

const repoUrl = repository.url.replace('.git', ''), branch = 'main'

const createSidebarItems = () => [
    shared.createGuideItem(true),
    shared.createLinksItem({
        branch,
        bugsUrl: bugs.url,
        fundingUrl: funding,
        repoUrl,
        version,
    }),
] as DefaultTheme.SidebarItem[]

export default defineConfig({
    title: name,
    description,

    cleanUrls: true,
    lastUpdated: true,

    markdown: {
        codeTransformers: [
            transformerTwoslash({
                twoslashOptions: {
                    compilerOptions: {
                        paths: {
                            'patreon-api.ts': ['../']
                        }
                    }
                }
            }),
        ],
        languages: ['js', 'ts'],
    },

    vite: {
        ssr: {
            noExternal: [ /\.css$/, /^vuetify/ ],
        },
        build: {
            chunkSizeWarningLimit: 800,
        },
    },

    sitemap: {
        hostname: homepage,
    },

    themeConfig: {
        nav: [
            shared.createGuideItem(false),
            { text: 'API Reference', link: 'https://patreon.apidocumentation.com/v2-stable/reference', },
            shared.createLinksItem({
                branch,
                bugsUrl: bugs.url,
                fundingUrl: funding,
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
                } satisfies GitHubStatsComponentProps,
            },
        ] as DefaultTheme.NavItem[],
        sidebar: {
            '/guide/': createSidebarItems(),
            '/apps/': createSidebarItems(),
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
            options: {
                detailedView: true,
            },
        },

        footer: {
            message: `Released under <a href="${repoUrl}/blob/${branch}/LICENSE">the ${license} License</a>.`,
            copyright: `Copyright © 2023 - present | ${author.name}`,
        },
    },
})
