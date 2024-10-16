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

const stars = fetch('https://api.github.com/repos/ghostrider-05/patreon-api.ts')
    .then(res => res.json() as Promise<Record<string, number>>)
    .then(res => res['watchers'])

// eslint-disable-next-line jsdoc/require-jsdoc
function createOverview(isSidebar: boolean, stars?: unknown) {
    return [
        shared.createGuideItem(isSidebar),
        isSidebar
            ? shared.createAppsItem()
            : { text: 'API', link: '/api/', activeMatch: '/api/' },
        shared.createLinksItem({
            branch,
            bugsUrl: bugs.url,
            repoUrl,
            version,
        }),
        ...(!isSidebar ? [
            { text: '<span class="vpi-social-github"></span> ' + stars + ' GitHub stars', link: repoUrl, noIcon: true, }
        ] : []),
    ]
}

const createNavItems = async () => createOverview(false, await stars) as DefaultTheme.NavItem[]
const createSidebarItems = () => createOverview(true) as DefaultTheme.SidebarItem[]

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
        nav: await createNavItems(),
        sidebar: {
            '/guide/': createSidebarItems(),
            '/apps/': createSidebarItems(),
            '/api/': [
                {
                    text: 'Patreon API',
                    items: [
                        {
                            text: 'Overview',
                            link: '/api',
                        },
                        {
                            text: 'OpenAPI schema',
                            link: openAPIUrlV2,
                            target: '_blank',
                        },
                        ...useSidebar({
                            spec: await fetchOpenAPISchema(openAPIUrlV2),
                            linkPrefix: '/api/',
                        }).generateSidebarGroups(),
                    ]
                }
            ]
        },

        externalLinkIcon: true,
        editLink: {
            text: 'Edit this page on GitHub',
            pattern: `${repoUrl}/edit/main/docs/:path`,
        },
        socialLinks: [
            {
                icon: 'github',
                link: repoUrl,
            }
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
