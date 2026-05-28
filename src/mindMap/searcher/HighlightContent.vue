<script setup lang="ts">
import {computed} from 'vue';

const props = withDefaults(
    defineProps<{
        showFirst?: number | undefined;
        content: string;
        viewRanges: [number, number][];
    }>(),
    {
        showFirst: 3,
    },
);

// 计算高亮后的内容片段
const highlightedContent = computed(() => {
    return props.content;
});
</script>

<template>
    <div
        class="result-content"
        v-html="highlightedContent"
    />
</template>

<style scoped>
.result-content {
    overflow: hidden;
    word-wrap: break-word;
    white-space: pre-wrap;
}
</style>

<style>
.result-content .highlight {
    background-color: var(--warning-color);
    color: #000;
    padding: 0 2px;
    border-radius: 2px;
}
</style>
