import { type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
// @ts-expect-error style import
import '@shikijs/vitepress-twoslash/style.css'

import { createVuetify } from 'vuetify'

import Layout from './Layout.vue'
// @ts-expect-error Style import
import './style.css'

import { VAutocomplete as AutoComplete } from 'vuetify/components/VAutocomplete'
import { VChip as Chip } from 'vuetify/components/VChip'
import { VTextField as InputText } from 'vuetify/components/VTextField'
import { VSelect as Select } from 'vuetify/components/VSelect'

import GitHubStat from '../components/GitHubStat.vue'

export default {
    Layout,
    async enhanceApp(ctx) {
        DefaultTheme.enhanceApp(ctx)

        ctx.app.use(createVuetify())
        ctx.app.use(TwoslashFloatingVue)

        ctx.app.component('AutoComplete', AutoComplete)
        ctx.app.component('Chip', Chip)
        ctx.app.component('InputText', InputText)
        ctx.app.component('Select', Select)

        ctx.app.component('GitHubStat', GitHubStat)
    },
} satisfies Theme
