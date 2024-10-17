<script setup lang="ts">
import { onMounted, ref } from 'vue';

const stat = ref(0)

const props = defineProps<{
    repo: string
    keyName: string
    iconClass: string
    label: string
}>()

onMounted(async () => {
    const res = await fetch('https://api.github.com/repos/' + props.repo)
        .then(res => res.json() as Promise<Record<string, number>>)
        .then(res => res[props.keyName])

    if (res) stat.value = res
})
</script>

<template>
    <p>
        <a :href="'https://github.com/' + repo"><span :class="iconClass"></span> {{ stat }} {{ label }}</a>
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
    border-radius: 6px;
    padding: 4px 14px;
    background-color: var(--vp-c-yellow-2);
    color: var(--vp-c-white) !important;
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
