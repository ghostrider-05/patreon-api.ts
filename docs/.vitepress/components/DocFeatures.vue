<script setup>
import Features from '../../node_modules/vitepress/dist/client/theme-default/components/VPFeatures.vue'
import { useData } from 'vitepress'

const { frontmatter: fm } = useData()

const props = defineProps({
  fmkey: {
    type: String,
    required: false
  },
})
</script>

<template>
    <div class="doc-features">
        <Features
            v-if="fm[props.fmkey ?? 'features']"
            class="VPHomeFeatures"
            :features="fm[props.fmkey ?? 'features']"
        />
    </div>
</template>

<style scoped>
:deep(.VPFeatures h2) {
  margin: 0 !important;
  padding: 0 !important;
  border-top: none !important;
}

:deep(.VPFeatures a) {
  text-decoration-line: none;
}

:deep(.VPFeatures p) {
  margin: 0;
}

.VPFeatures {
  padding: 0 !important;
}
</style>
