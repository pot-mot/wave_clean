<script setup lang="ts">
import {VueFlow} from "@vue-flow/core";
import ContentNode from "@/mindMap/node/ContentNode.vue";
import ContentEdge from "@/mindMap/edge/ContentEdge.vue";
import {MindMapLayer, useMindMap} from "@/mindMap/useMindMap.ts";
import {Background} from "@vue-flow/background";

const props = defineProps<{
    layer: MindMapLayer,
}>()

const {currentLayer, initLayer} = useMindMap()

initLayer(props.layer)
</script>

<template>
    <VueFlow
        :id="layer.id"
        :class="{
            current: layer.id === currentLayer.id,
            notCurrent: layer.id !== currentLayer.id,
            visible: layer.visible,
            invisible: !layer.visible,
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
        <Background v-if="layer.id === currentLayer.id" :id="layer.id" pattern-color="var(--border-color)"/>

        <template #node-CONTENT_NODE="nodeProps">
            <ContentNode v-bind="nodeProps"/>
        </template>

        <template #edge-CONTENT_EDGE="edgeProps">
            <ContentEdge v-bind="edgeProps"/>
        </template>
    </VueFlow>
</template>

<style scoped>
.vue-flow.notCurrent,
.vue-flow.invisible,
.vue-flow.notCurrent *,
.vue-flow.invisible * {
    pointer-events: none !important;
}

.vue-flow.invisible {
    opacity: 0;
}

.vue-flow.current.visible {
    opacity: 1;
}

.vue-flow.notCurrent.visible {
    opacity: 0.5;
}

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
