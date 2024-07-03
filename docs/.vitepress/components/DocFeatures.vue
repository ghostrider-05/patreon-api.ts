<script setup>
import Features from '../../node_modules/vitepress/dist/client/theme-default/components/VPHomeFeatures.vue'
</script>

<template>
    <div class="doc-features">
        <Features />
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
