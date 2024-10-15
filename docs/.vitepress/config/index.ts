import { defineConfig } from 'vitepress'

import { useSidebar } from 'vitepress-openapi'

import * as shared from './shared'

import { fetchOpenAPISchema, openAPIUrlV2 } from '../theme/openapi'

import {
    author,
    description,
    license,
    name,
    version,
} from '../../../package.json'

// eslint-disable-next-line jsdoc/require-jsdoc
function createOverview(isSidebar = false) {
    return [
        shared.createGuideItem(isSidebar),
        ...(!isSidebar ? [{ text: 'API', link: '/api/', activeMatch: '/api/' }] : []),
        // shared.createPlaygroundItem(isSidebar),
        shared.createAppsItem(),
        shared.createLinksItem(version),
    ]
}

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
        nav: createOverview(),
        sidebar: {
            '/guide/': createOverview(true),
            '/apps/': createOverview(true),
            '/api/': [
                {
                    text: 'Patreon API',
                    items: [
                        {
                            text: 'Overview',
                            link: '/api',
                        },
                        ...useSidebar({
                            spec: await fetchOpenAPISchema(openAPIUrlV2),
                            linkPrefix: '/api/',
                        }).generateSidebarGroups(),
                        {
                            text: 'OpenAPI schema',
                            link: openAPIUrlV2,
                            target: '_blank',
                        }
                    ]
                }
            ]
        },

        externalLinkIcon: true,
        editLink: {
            text: 'Edit this page on GitHub',
            pattern: 'https://github.com/ghostrider-05/patreon-api.ts/edit/main/docs/:path',
        },
        socialLinks: [
            {
                icon: 'github',
                link: 'https://github.com/ghostrider-05/patreon-api.ts',
            }
        ],

        outline: 'deep',
        search: {
            provider: 'local',
        },

        footer: {
            message: `Released under the ${license} License.`,
            copyright: `Copyright © 2024 - present | ${author.name}`,
        },
    },
})
