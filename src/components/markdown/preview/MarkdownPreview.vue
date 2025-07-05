<script setup lang="ts">
import {md} from "@/components/markdown/preview/markdownRender.ts";
import {computed} from "vue";

const props = defineProps<{
    value: string
}>()

const renderResult = computed(() => md.render(props.value))
</script>

<template>
    <div
        class="markdown-preview"
        v-html="renderResult"
    />
</template>

<style scoped>
.markdown-preview {
    cursor: text;
    user-select: text;
    white-space: pre;
    border: var(--border);
    border-radius: var(--border-radius);
    background-color: var(--background-color);
    padding: 8px;
    tab-size: 4;
    transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}
</style>