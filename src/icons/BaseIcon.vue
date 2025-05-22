<script setup lang="ts">
withDefaults(defineProps<{
    color?: string,
    size?: number,
}>(), {
    size: 16,
    color: "var(--icon-color)"
})
</script>

<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        class="base-icon"
        :width="size"
        :height="size"
        :stroke="color"
        viewBox="0 0 24 24"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        fill="none"
    >
        <slot/>
    </svg>
</template>

<style scoped>
.base-icon {
    display: inline-block;
    vertical-align: middle;
    user-select: none;
}
</style>
