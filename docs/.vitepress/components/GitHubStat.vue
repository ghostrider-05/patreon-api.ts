<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { VPLink } from 'vitepress/theme'

const stat = ref(0)

export interface GitHubStatsComponentProps {
    repo: string
    keyName: string
    iconClass: string
    label: string
}

const props = defineProps<GitHubStatsComponentProps>()

onMounted(async () => {
    const res = await fetch('https://api.github.com/repos/' + props.repo)
        .then(res => res.json() as Promise<Record<string, number>>)
        .then(res => res[props.keyName])

    if (res) stat.value = res
})
</script>

<template>
    <p>
        <VPLink :href="'https://github.com/' + repo"><span :class="iconClass"></span> {{ stat }} {{ label }}</VPLink>
    </p>
</template>

<style scoped>
.VPNavScreenMenu p {
    margin-top: 20px;
}

p {
    display: flex;
    align-items: center;
    justify-content: center;
}

a:hover {
    cursor: pointer;
}

a {
    line-height: 20px;
    border-radius: 3px;
    padding: 0px 4px;
    background-color: var(--vp-c-bg-soft);
    color: var(--vp-c-brand-1) !important;
    display: flex;
    align-items: center;
    justify-content: center;
}

a span {
    background-color: var(--vp-c-white);
    border-color: var(--vp-c-white);
    width: 20px !important;
    height: 20px !important;
    margin: 5px;
}
</style>
