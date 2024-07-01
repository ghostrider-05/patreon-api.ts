import { defineConfig } from 'vitepress'

import * as shared from './shared'

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
        shared.createPlaygroundItem(isSidebar),
        shared.createAppsItem(),
        shared.createLinksItem(version),
    ]
}

export default defineConfig({
    title: name,
    description,

    cleanUrls: true,
    lastUpdated: true,

    themeConfig: {
        nav: createOverview(),
        sidebar: createOverview(true),

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
