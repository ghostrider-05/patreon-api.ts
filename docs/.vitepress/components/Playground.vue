<script setup lang="ts">
import { ref } from 'vue';
import { useLocalStorage, useFetch, useOffsetPagination } from '@vueuse/core'

import type { LibraryData } from './data.js'

const data = ref<LibraryData>()

const url = 'https://patreon-docs.ghostrider.workers.dev'
const { onFetchResponse } = useFetch(url)

onFetchResponse(async (res) => {
    data.value = await res.json()
})

const settings = [
    {
        key: 'access_token',
        title: 'Access token',
        required: true,
    },
    {
        key: 'user_agent',
        title: 'User Agent',
        required: false,
        value: ''
    },
    {
        key: 'base',
        title: 'API base url',
        required: false,
    }
]

async function makeRequest (route: string, query: string) {
    
}

</script>

<template>
    <div class="api-playground">
        <div class="playground-settings">
            <div class="settings-header">
                <p>Settings</p>
            </div>
            <div class="settings-rows" v-for="i in Array.from({ length: Math.ceil(settings.length / 2) }, (_, i) => i)">
                {{ i }}
            </div>
        </div>
        {{ data }}
    </div>
</template>