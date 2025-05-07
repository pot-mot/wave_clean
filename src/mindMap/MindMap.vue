<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";
import MobileBar from "@/mindMap/toolBar/mobile/MobileBar.vue";
import DeskTopBar from "@/mindMap/toolBar/desktop/DeskTopBar.vue";
import MindMapLayer from "@/mindMap/layer/MindMapLayer.vue";

const {
    isTouchDevice,
    layers,
} = useMindMap()
</script>

<template>
    <div
        tabindex="-1"
        style="width: 100%; height: 100%;"
        :style="{ backgroundColor: 'var(--background-color)' }"
    >
        <template v-for="layer in layers" :key="layer.id">
            <MindMapLayer :layer="layer"/>
        </template>

        <template v-if="isTouchDevice">
            <MobileBar/>
        </template>
        <template v-else>
            <DeskTopBar/>
        </template>
    </div>
</template>
