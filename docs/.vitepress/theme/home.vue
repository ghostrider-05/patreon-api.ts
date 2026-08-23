<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { useData } from 'vitepress'
import { VPHomeHero } from 'vitepress/theme'
import { useIntervalFn } from '@vueuse/core'

const { page } = useData()
let index = 0

function replaceTarget () {
  	if (page.value.frontmatter.layout !== 'home') return
  	const { targets } = page.value.frontmatter

  	const targetClass = 'hero-target', targetIndex = 0
  	if (!document.getElementsByClassName(targetClass).item(targetIndex)) return

  	// @ts-expect-error Already checked before
	document.getElementsByClassName(targetClass).item(targetIndex).innerHTML = targets[index]
  	index = (targets.length - 1) === index ? 0 : ++index
}

const { resume } = useIntervalFn(() => {
  	replaceTarget()
}, 5_000)

onMounted(() => nextTick(() => resume()))
</script>

<template>
	<!-- <VPHomeHero /> -->
</template>

<style>
.hero-target {
  	color: var(--vp-c-brand-1) !important;
}

.image-src {
  	border-radius: 10px;
}
</style>
