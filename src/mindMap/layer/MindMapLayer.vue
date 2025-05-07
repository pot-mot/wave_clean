<script setup lang="ts">
import {VueFlow} from "@vue-flow/core";
import ContentNode from "@/mindMap/node/ContentNode.vue";
import ContentEdge from "@/mindMap/edge/ContentEdge.vue";
import {MindMapLayer, useMindMap} from "@/mindMap/useMindMap.ts";

const props = defineProps<{
    layer: MindMapLayer,
}>()

const {currentLayer, initLayer} = useMindMap()

initLayer(props.layer)
</script>

<template>
    <VueFlow
        :id="layer.id"
        :style="{
            pointerEvents: (layer.id === currentLayer.id && layer.visible) ? undefined : 'none',
            opacity: layer.visible ? (layer.id === currentLayer.id ? 1 : 0.6) : 0
        }"

        tabindex="-1"
        style="width: 100%; height: 100%; background-color: transparent; position: absolute; top: 0; left: 0;"
        :zoom-on-pinch="false"
        :zoom-on-double-click="false"
        :edges-updatable="true"
        :multi-selection-key-code="null"
        :connect-on-click="false"
        :select-nodes-on-drag="false"
        :selection-key-code="false"
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
