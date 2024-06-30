import { type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import Layout from './Layout.vue'
import './style.css'

export default {
    Layout,
    enhanceApp(ctx) {
        DefaultTheme.enhanceApp(ctx)
    },
} satisfies Theme
