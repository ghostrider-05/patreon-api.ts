import { type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import { createVuetify } from 'vuetify'

import Layout from './Layout.vue'
import './style.css'

import { VAutocomplete as AutoComplete } from 'vuetify/components/VAutocomplete'
import { VChip as Chip } from 'vuetify/components/VChip'
import { VTextField as InputText } from 'vuetify/components/VTextField'
import { VSelect as Select } from 'vuetify/components/VSelect'

export default {
    Layout,
    enhanceApp(ctx) {
        DefaultTheme.enhanceApp(ctx)
        ctx.app.use(createVuetify())

        ctx.app.component('AutoComplete', AutoComplete)
        ctx.app.component('Chip', Chip)
        ctx.app.component('InputText', InputText)
        ctx.app.component('Select', Select)
    },
} satisfies Theme
