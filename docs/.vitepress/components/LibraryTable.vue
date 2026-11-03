<script setup lang="ts">
import { StyleValue } from 'vue'

const greenColor = 'var(--vp-c-green-3)'
const redColor = 'var(--vp-c-red-3)'

const officialText = 'Official'

interface Key {
    id: string
    name: string
    title: string
    colors?: 'boolean' | Record<number, 'green' | 'red'>
}

const props = defineProps<{
    keys: Key[]
    values: ({
        title: string
        link?: string
    } & Record<string, number | boolean>)[]
    colors: Record<'green' | 'red', { color: string, value: boolean }>
    badges?: {
        type?: string
        text: string
        id: string
    }[]
}>()

function getColor (key: Key, value: number | boolean): string | undefined {
    if (!key.colors) return undefined
    const colorOptions = props.colors
    if (key.colors === 'boolean') return Object.values(colorOptions).find(c => c.value === value)?.color
    else return colorOptions[key.colors[<number>value]]?.color
}

function getStyle (key: Key, value: number | boolean): StyleValue {
    const color = getColor(key, value)
    if (color) return { backgroundColor: color, color: 'var(--vp-c-neutral-inverse)', textAlign: 'center' }
    else return {}
}

function getLabel (value: boolean | number | string): string {
    return typeof value === 'boolean'
        ? value ? 'Yes' : 'No'
        : value.toString()
} 
</script>

<template>
    <table>
        <thead>
            <tr>
                <th v-for="key in keys" :title="key.title">
                    {{ key.name }}
                </th>
            </tr>
        </thead>

        <tbody>
            <tr v-for="lib in values">
                <td v-for="key in keys" :style="getStyle(key, lib[key.id])">
                    <span v-if="key.id === 'title'">
                        <a :href="lib.link" v-if="lib.link">{{ lib.title }}</a>
                        <span v-else>{{ lib.title }}</span>

                        <span
                            v-for="badge in badges ?? []"
                            :key="badge.id"
                        >
                            <Badge
                                :text="badge.text"
                                v-if="lib[badge.id]"
                                :type="badge.type ?? 'info'"
                            />
                        </span>
                    </span>

                    <span v-else>
                        {{ getLabel(lib[key.id])  }}
                    </span>
                </td>
            </tr>
        </tbody>
    </table>
</template>
