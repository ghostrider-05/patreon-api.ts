import { type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import { createVuetify } from 'vuetify'

import { theme, useOpenapi } from 'vitepress-openapi'
// @ts-expect-error Style import
import 'vitepress-openapi/dist/style.css'

import { fetchOpenAPISchema, openAPIUrlV2 } from './openapi'
import Layout from './Layout.vue'
// @ts-expect-error Style import
import './style.css'

import { VAutocomplete as AutoComplete } from 'vuetify/components/VAutocomplete'
import { VChip as Chip } from 'vuetify/components/VChip'
import { VTextField as InputText } from 'vuetify/components/VTextField'
import { VSelect as Select } from 'vuetify/components/VSelect'

export default {
    Layout,
    async enhanceApp(ctx) {
        DefaultTheme.enhanceApp(ctx)
        ctx.app.use(createVuetify())

        const spec = await fetchOpenAPISchema(openAPIUrlV2)

        // @ts-expect-error Unused variable
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const openapi = useOpenapi({ spec })

        theme.enhanceApp({ app: ctx.app })

        ctx.app.component('AutoComplete', AutoComplete)
        ctx.app.component('Chip', Chip)
        ctx.app.component('InputText', InputText)
        ctx.app.component('Select', Select)
    },
} satisfies Theme
