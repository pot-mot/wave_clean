<script setup lang="ts">
defineProps<{
    value: string
}>()
</script>

<template>
    <div class="markdown-preview">
        {{ value }}
    </div>
</template>

<style scoped>
.markdown-preview {
    white-space: pre;
    border: var(--border);
    border-radius: var(--border-radius);
    background-color: var(--background-color);
    padding: 8px;
    tab-size: 4;
    transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}
</style>