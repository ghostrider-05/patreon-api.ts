<script setup lang="ts">
const greenColor = 'var(--vp-c-green-3)'
const redColor = 'var(--vp-c-red-3)'

const officialText = 'Official'

interface Key {
    id: string
    name: string
    title: string
    colors?: 'boolean' | Record<number, 'green' | 'red'>
}

function getColor (key: Key, value: number | boolean) {
    if (!key.colors) return undefined
    else if (key.colors === 'boolean') return value === true ? greenColor : redColor
    else return { red: redColor, green: greenColor }[key.colors[<number>value]]
}

function getStyle (key: Key, value: number | boolean) {
    const color = getColor(key, value)
    if (color) return { backgroundColor: color, color: 'var(--vp-c-neutral-inverse)', textAlign: 'center' }
    else return {}
}

function getLabel (value: boolean | number | string) {
    return typeof value === 'boolean'
        ? value ? 'Yes' : 'No'
        : value
} 
</script>

<template>
    <table>
        <thead>
            <tr>
                <th v-for="key in $frontmatter.keys" :title="key.title">
                    {{ key.name }}
                </th>
            </tr>
        </thead>

        <tbody>
            <tr v-for="lib in $frontmatter.libraries">
                <td v-for="key in $frontmatter.keys" :style="getStyle(key, lib[key.id])">
                    <span v-if="key.id === 'title'">
                        <a :href="lib.link" v-if="lib.link">{{ lib.title }}</a>
                        <span v-else>{{ lib.title }}</span>
                        <Badge :text="officialText" v-if="lib.official" type="info" />
                    </span>

                    <span v-else>
                        {{ getLabel(lib[key.id])  }}
                    </span>
                </td>
            </tr>
        </tbody>
    </table>
</template>
