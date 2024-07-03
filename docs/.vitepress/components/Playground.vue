<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLocalStorage, useFetch } from '@vueuse/core'
import { useData } from 'vitepress'

import type { LibraryData, Route } from './data.js'

const { isDark } = useData()

const url = 'https://patreon-docs.ghostrider.workers.dev'
// Only GET is allowed in the playground!
const allowedMethod: string = 'GET'

const data = ref<LibraryData>()
const activeRoute = ref<Route>(), idParam = ref<string>()
const lastRequest = ref()

const includedFields = ref<string[]>([]), attributes = ref<{ type: string, key: string }[]>([])

function groupAttributes () {
    const keys = [...new Set(attributes.value.map(a => a.type))]

    return keys.reduce((obj, key) => ({
        ...obj,
        [`fields[${key}]`]: attributes.value
            .filter(a => a.type === key )
            .map(a => a.key)
            .join(',')
    }), {} as Record<string, string>)
}

const { onFetchResponse } = useFetch(url + '/data')

onFetchResponse(async (res) => {
    data.value = await res.json()
    activeRoute.value = data.value?.routes[0]
})

const props = withDefaults(defineProps<{
    errorFailedResponse?: string
    errorNoConfiguration?: string
    errorNoId?: string
    errorNoRoute?: string
    errorNoToken?: string
    errorNoProxy?: string

    blockErrorTitle?: string
    blockQueryTitle?: string
    blockSettingsTitle?: string

    settingsDescriptionHTML?: string
    settingsTokenLabel?: string
    settingsTokenPlaceholder?: string
    settingsUserAgentLabel?: string
    settingsBaseUrlLabel?: string
    settingsProxyUrlLabel?: string

    proxyUrl?: string
    requestButtonLabel?: string
    requestIdPlaceholder?: string
    requestAuthorizationHeaderPrefix?: string
}>(), {
    errorFailedResponse: 'Failed request. See the network tab for more details',
    errorNoConfiguration: 'Failed to fetch the API configuration. Try again or open an issue on GitHub with the network logs',
    errorNoId: 'No resource id found. Enter the id of the resource you are requesting',
    errorNoRoute: 'No route found',
    errorNoToken: 'No access token found. Add a token to authorize the request',
    errorNoProxy: 'No server (proxy) url found',

    blockErrorTitle: 'Error',
    blockQueryTitle: 'Query',
    blockSettingsTitle: 'Settings',

    settingsDescriptionHTML: `
    Your settings are stored locally for this site.
    Request are made to Patreon through a server,
    by default <a href="https://github.com/ghostrider-05/patreon-api.ts/tree/main/apps/worker-docs">the <code>apps/worker-docs</code> worker on GitHub</a>
    `,
    settingsTokenLabel: 'Access token',
    settingsTokenPlaceholder: 'Token to authorize',
    settingsUserAgentLabel: 'User Agent',
    settingsBaseUrlLabel: 'Base URL',
    settingsProxyUrlLabel: 'Proxy URL',

    proxyUrl: url + '/proxy',
    requestButtonLabel: 'Request',
    requestIdPlaceholder: ':id',
    requestAuthorizationHeaderPrefix: 'Bearer',
})

const defaultUserAgent = computed(() => data.value?.headers.userAgent ?? '')
const defaultBaseUrl = computed(() => data.value?.base ?? '')

const accessToken = useLocalStorage('access_token', undefined)
const userAgent = useLocalStorage('user_agent', defaultUserAgent)
const base = useLocalStorage('base_url', defaultBaseUrl)
const proxy = useLocalStorage('proxy_url', props.proxyUrl)

const componentTheme = computed(() => isDark.value ? 'dark' : 'light')

const possibleRoutes = computed(() => {
    return data.value?.routes.filter(({ methods }) => {
        return methods == undefined
            || methods.some(m => typeof m === 'string' ? m === allowedMethod : m.method === allowedMethod)
    })
})
const possibleIncludeFields = computed(() => {
    return data.value?.relationships[activeRoute.value!.relationship_type].map(r => r.includeKey)
        ?? []
})

const path = computed(() => {
    if (!activeRoute.value) return
    const { route, requires_id } = activeRoute.value

    const params = new URLSearchParams(groupAttributes())
    if (includedFields.value.length) {
        params.set('include', includedFields.value.join(','))
    }

    const query = params.toString()

    return (base.value ?? defaultBaseUrl.value)
        + (requires_id ? route.replace(props.requestIdPlaceholder, idParam.value!) : route)
        + (query.length ? ('?' + query) : '')
})

const errorMessages = computed(() => {
    const token = accessToken.value, id = idParam.value

    if (data.value == undefined) return [props.errorNoConfiguration]
    if (!activeRoute.value) return [props.errorNoRoute]

    const messages: string[] = []

    if (activeRoute.value.requires_id && !id) messages.push(props.errorNoId)
    if (!token) messages.push(props.errorNoToken)
    if (!proxy.value) messages.push(props.errorNoProxy)

    return messages
})

async function makeRequest() {
    const res = await fetch(proxy.value!, {
        method: 'POST',
        body: JSON.stringify({
            url: path.value!,
            method: allowedMethod,
            headers: {
                'Authorization': 'Bearer ' + accessToken.value!,
                'Content-Type': 'application/json',
                'User-Agent': userAgent.value || defaultUserAgent.value,
            },
        }),
    }).then(res => res.json()).catch(() => props.errorFailedResponse)

    lastRequest.value = res
}

function resetSelection() {
    idParam.value = undefined

    includedFields.value = []
    attributes.value = []
}

function getResourceKey(route: Route, includedKey: string) {
    return data.value!.relationships[route.relationship_type].find(r => r.includeKey === includedKey)!.resourceKey
}
</script>

<template>
    <div class="api-playground">
        <div class="playground-settings" style="margin: 20px 0;">
            <details class="details custom-block" open>
                <summary class="title">{{ blockSettingsTitle }}</summary>
                <p v-html="settingsDescriptionHTML"></p>

                <div class="settings">
                    <div class="settings-row">
                        <div class="setting">
                            <InputText
                                v-model="accessToken"
                                :label="settingsTokenLabel"
                                :placeholder="settingsTokenPlaceholder"
                                variant="outlined"
                            />
                        </div>
                        <div class="setting">
                            <InputText v-model="userAgent" :label="settingsUserAgentLabel" variant="outlined" />
                        </div>
                    </div>
                    <div class="settings-row">
                        <div class="setting">
                            <InputText v-model="base" :label="settingsBaseUrlLabel" variant="outlined" />
                            <InputText v-model="proxy" :label="settingsProxyUrlLabel" variant="outlined" />
                        </div>
                    </div>
                </div>
            </details>
        </div>

        <div class="request-options" v-if="data">
            <Select
                style="width: 100%"
                @update:modelValue="resetSelection()"
                label="Select"
                variant="outlined"
                :items="possibleRoutes"
                v-model="activeRoute"
                item-title="route"
                return-object
                single-line
                :theme="componentTheme"
            />

            <InputText
                v-if="activeRoute?.requires_id"
                :label="`${activeRoute.relationship_type} id`"
                style="width: 100%; margin: 10px 0;"
                variant="outlined"
            />

            <details class="details custom-block" open>
                <summary>{{ blockQueryTitle }}</summary>

                <div class="included-field">
                    <AutoComplete
                        v-model="includedFields"
                        multiple
                        chips
                        variant="outlined"
                        label="Included resources"
                        :items="possibleIncludeFields"
                        :item-props="{ style: { backgroundColor: 'var(--vp-c-brand-1)', color: 'var(--vp-c-white)' } }"
                        :theme="componentTheme"
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
                            :theme="componentTheme"
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
                    <h4 class="title">{{ blockErrorTitle }}</h4>
                    {{ err }}
                </div>
            </div>
            <div class="actions" v-else>
                <button @click="makeRequest()">{{ requestButtonLabel }}</button>

                <hr>
                <span v-if="lastRequest">
                    <pre style="width: 100%; overflow-x: scroll; background-color: var(--vp-c-bg-soft);">
                        {{ JSON.stringify(lastRequest, null, 2) }}
                    </pre>
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
    color: var(--vp-c-white);
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