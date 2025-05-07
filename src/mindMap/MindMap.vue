<script setup lang="ts">
import {MIND_MAP_ID, useMindMap} from "@/mindMap/useMindMap.ts";
import {Background} from "@vue-flow/background";
import MobileBar from "@/mindMap/toolBar/mobile/MobileBar.vue";
import DeskTopBar from "@/mindMap/toolBar/desktop/DeskTopBar.vue";
import MindMapLayer from "@/mindMap/layer/MindMapLayer.vue";

const {
    isTouchDevice,
} = useMindMap()
</script>

<template>
    <div
        tabindex="-1"
        style="width: 100%; height: 100%;"
        :style="{ backgroundColor: 'var(--background-color)' }"
    >
        <Background pattern-color="var(--border-color)"/>

        <MindMapLayer :id="MIND_MAP_ID"/>

        <template v-if="isTouchDevice">
            <MobileBar/>
        </template>
        <template v-else>
            <DeskTopBar/>
        </template>
    </div>
</template>
