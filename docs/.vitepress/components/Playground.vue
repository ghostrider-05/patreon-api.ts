<script setup lang="ts">
import { Ref, computed, ref } from 'vue';
import { useLocalStorage, useFetch } from '@vueuse/core'

import type { LibraryData, Route } from './data.js'

const data = ref<LibraryData>()
const activeRoute = ref<Route>(), idParam = ref<string>()

const includedFields = ref<string[]>([]), attributes = ref<{ type: string, key: string }[]>([])

function resetSelection() {
    idParam.value = undefined

    includedFields.value = []
    attributes.value = []
}

function getResourceKey(route: Route, includedKey: string) {
    return data.value!.relationships[route.relationship_type].find(r => r.includeKey === includedKey)!.resourceKey
}

function groupAttributes () {
    const keys = [...new Set(attributes.value.map(a => a.type))]

    return keys.reduce((obj, key) => ({ ...obj, [`fields[${key}]`]: attributes.value.filter(a => a.type === key ).map(a => a.key).join(',') }), {} as Record<string, string>)
}

const url = 'https://patreon-docs.ghostrider.workers.dev'
const { onFetchResponse } = useFetch(url + '/data')

onFetchResponse(async (res) => {
    data.value = await res.json()
    activeRoute.value = data.value?.routes[0]
})

const defaultUserAgent = computed(() => data.value?.headers.userAgent ?? '')
const defaultBaseUrl = computed(() => data.value?.base ?? '')

const accessToken = useLocalStorage('access_token', undefined)
const userAgent = useLocalStorage('user_agent', defaultUserAgent)
const base = useLocalStorage('base_url', defaultBaseUrl)

const possibleIncludeFields = computed(() => data.value?.relationships[activeRoute.value!.relationship_type].map(r => r.includeKey) ?? [])
const path = computed(() => {
    if (!activeRoute.value) return
    const { route, requires_id } = activeRoute.value

    const params = new URLSearchParams(groupAttributes())
    if (includedFields.value.length) {
        params.set('include', includedFields.value.join(','))
    }

    const query = params.toString()

    return (base.value ?? defaultBaseUrl.value)
        + (requires_id ? route.replace(':id', idParam.value!) : route)
        + (query.length ? ('?' + query) : '')
})

const errorMessages = computed(() => {
    const token = accessToken.value, id = idParam.value

    if (!activeRoute.value) return ['No route found']

    const messages: string[] = []

    if (activeRoute.value.requires_id && !id) messages.push('No resource id found. Enter the id of the resource you are requesting')
    if (!token) messages.push('No access token found. Add a token to authorize the request')

    return messages
})

const lastRequest = ref()

async function makeRequest() {
    const res = await fetch(url + '/proxy', {
        method: 'POST',
        body: JSON.stringify({
            path: path.value!,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accessToken.value!,
                'Content-Type': 'application/json',
                'User-Agent': userAgent.value ?? defaultUserAgent.value,
            },
        }),
    }).then(res => res.json()).catch(() => 'Failed request. See the network tab for more details')

    lastRequest.value = res
}

</script>

<template>
    <div class="api-playground">
        <div class="playground-settings" style="margin: 20px 0;">
            <details class="details custom-block" open>
                <summary class="title">Settings</summary>

                <div class="settings">
                    <div class="settings-row">
                        <div class="setting">
                            <InputText
                                v-model="accessToken"
                                label="Access token"
                                placeholder="Token to authorize"
                                variant="outlined"
                            />
                        </div>
                        <div class="setting">
                            <InputText v-model="userAgent" label="User agent" variant="outlined" />
                        </div>
                    </div>
                    <div class="settings-row">
                        <div class="setting">
                            <InputText v-model="base" label="Base URL" placeholder="API base url" variant="outlined" />
                        </div>
                    </div>
                </div>
            </details>
        </div>

        <div class="request-options" v-if="data">
            <Select style="width: 100%" @update:modelValue="resetSelection()" label="Select" variant="outlined"
                :items="data.routes" v-model="activeRoute" item-title="route" return-object single-line />

            <InputText v-if="activeRoute?.requires_id" :label="`${activeRoute.relationship_type} id`"
                style="width: 100%; margin: 10px 0;" variant="outlined" />

            <details class="details custom-block" open>
                <summary>Query</summary>


                <div class="included-field">
                    <AutoComplete
                        v-model="includedFields"
                        multiple
                        chips
                        variant="outlined"
                        label="Included resources"
                        :items="possibleIncludeFields"
                        :item-props="{ style: { backgroundColor: 'var(--vp-c-brand-1)', color: 'var(--vp-c-white)' } }"
                    />

                    <div 
                        class="attribute-field"
                        v-for="([included, key]) in includedFields
                            .map(inc => ([inc, getResourceKey(activeRoute, inc)]))
                            .concat([[activeRoute.relationship_type, activeRoute.relationship_type]])"
                    >
                        <AutoComplete
                            v-model="attributes"
                            v-if="data.schemas[key].length > 0"
                            multiple
                            clearable
                            chips
                            return-object
                            variant="outlined"
                            :items="data.schemas[key].sort((a, b) => b - a).map(k => ({ key: k, type: key, value: key + '.' + k }))"
                            item-title="key"
                            item-value="value"
                            :label="`Select ${included} attributes`"
                        >
                            <template #chip="{ props, item }">
                                <Chip v-bind="props" v-if="item.raw.type === key" :text="item.raw.key" />
                            </template>
                        </AutoComplete>
                    </div>
                </div>
            </details>

            <div class="errors" v-if="errorMessages.length > 0">
                <div class="custom-block danger" v-for="err in errorMessages" :key="err">
                    <h4 class="title">Error</h4>
                    {{ err }}
                </div>
            </div>
            <div class="actions" v-else>
                <button @click="makeRequest()">Request</button>

                <hr>
                <span v-if="lastRequest">
                    {{ JSON.stringify(lastRequest, null, 4) }}
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
button,
input,
optgroup,
option,
select,
textarea {
    color: var(--vp-c-text-1) !important;
    background-color: var(--vp-c-bg-soft);
}

button {
    background-color: var(--vp-c-brand-1);
    border-radius: 4px;
    padding: 10px 40px;
}

.included-field {
    display: flex;
    flex-direction: column;
}

.attribute-field {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
}

.settings {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    flex-direction: row;
}

.settings-row {
    min-width: 300px;
    width: 45%;
}
</style>