---
aside: false
outline: false
---

<script setup lang="ts">
import { useRoute, useData } from 'vitepress'

const route = useRoute()

const { isDark } = useData()

const operationId = route.data.params.operationId
</script>

<OAOperation :operationId="operationId" :isDark="isDark" />
