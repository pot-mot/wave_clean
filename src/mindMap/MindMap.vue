<script setup lang="ts">
import {VueFlow} from "@vue-flow/core";
import ContentNode from "@/mindMap/ContentNode.vue";
import ContentEdge from "@/mindMap/ContentEdge.vue";
import {MIND_MAP_ID, useMindMap} from "@/mindMap/useMindMap.ts";
import {Background} from "@vue-flow/background";
import MobileBar from "@/mindMap/toolBar/mobile/MobileBar.vue";
import DeskTopBar from "@/mindMap/toolBar/desktop/DeskTopBar.vue";

const {
    isTouchDevice,
} = useMindMap()
</script>

<template>
    <VueFlow
        :id="MIND_MAP_ID"
        tabindex="-1"
        style="width: 100%; height: 100%;"
        :style="{ backgroundColor: 'var(--background-color)' }"
        :zoom-on-pinch="false"
        :zoom-on-double-click="false"
    >
        <Background pattern-color="var(--border-color)"/>

        <template #node-CONTENT_NODE="nodeProps">
            <ContentNode v-bind="nodeProps"/>
        </template>

        <template #edge-CONTENT_EDGE="edgeProps">
            <ContentEdge v-bind="edgeProps"/>
        </template>

        <template v-if="isTouchDevice">
            <MobileBar/>
        </template>
        <template v-else>
            <DeskTopBar/>
        </template>
    </VueFlow>
</template>

<style scoped>
:deep(.vue-flow__nodesselection-rect) {
    box-sizing: content-box;
    border-radius: var(--border-radius);
    border-style: solid;
    border-color: var(--primary-color);
    padding: 1rem;
    transform: translateX(-1rem) translateY(-1rem);
}

:deep(.vue-flow__pane.draggable) {
    cursor: default;
}


:deep(.vue-flow__pane.dragging) {
    cursor: default;
}
</style>
