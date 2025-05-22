<script lang="ts" setup>
import {computed} from 'vue'
import {ViewportTransform} from "@vue-flow/core";

const props = withDefaults(
    defineProps<{
        viewport: ViewportTransform,
        gapX?: number,
        gapY?: number,
    }>(),
    {
        gapX: 20,
        gapY: 20,
    }
)

const background = computed(() => {
    const zoom = props.viewport.zoom

    return {
        gapX: props.gapX * zoom,
        gapY: props.gapY * zoom,
        r: zoom,
    }
})
</script>

<template>
    <svg class="vue-flow__background" style="height: 100%; width: 100%;">
        <pattern
            id="flow__background_pattern"
            :x="viewport.x % background.gapX"
            :y="viewport.y % background.gapY"
            :width="background.gapX"
            :height="background.gapY"
            patternUnits="userSpaceOnUse"
        >
            <circle :r="background.r" color="var(--background-color-hover)"/>
        </pattern>

        <rect :x="0" :y="0" width="100%" height="100%" fill="url(#flow__background_pattern)"/>
    </svg>
</template>
