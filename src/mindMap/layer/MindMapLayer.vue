<script setup lang="ts">
import {VueFlow} from "@vue-flow/core";
import ContentNode from "@/mindMap/node/ContentNode.vue";
import ContentEdge from "@/mindMap/edge/ContentEdge.vue";

defineProps<{
    id: string
}>()
</script>

<template>
    <VueFlow
        :id="id"
        tabindex="-1"
        style="width: 100%; height: 100%; background-color: transparent;"
        :zoom-on-pinch="false"
        :zoom-on-double-click="false"
    >
        <template #node-CONTENT_NODE="nodeProps">
            <ContentNode v-bind="nodeProps"/>
        </template>

        <template #edge-CONTENT_EDGE="edgeProps">
            <ContentEdge v-bind="edgeProps"/>
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
