<script setup lang="ts">
import {VueFlow} from "@vue-flow/core";
import ContentNode from "@/mindMap/node/ContentNode.vue";
import ContentEdge from "@/mindMap/edge/ContentEdge.vue";
import {MindMapLayer, useMindMap} from "@/mindMap/useMindMap.ts";
import {computed} from "vue";

const props = defineProps<{
    layer: MindMapLayer,
}>()

const {currentLayer, initLayer} = useMindMap()

const layerOpacity = computed(() => props.layer.opacity)

initLayer(props.layer)
</script>

<template>
    <VueFlow
        :id="layer.vueFlow.id"
        :class="{
            current: layer.id === currentLayer.id,
            notCurrent: layer.id !== currentLayer.id,
            visible: layer.visible,
            invisible: !layer.visible,
        }"

        tabindex="-1"
        style="width: 100%; height: 100%; background-color: transparent; position: absolute; top: 0; left: 0; overflow: hidden;"
        :min-zoom="0.1"
        :max-zoom="10"
        :edge-updater-radius="5"
        :zoom-on-pinch="false"
        :zoom-on-double-click="false"
        :edges-updatable="true"
        :multi-selection-key-code="null"
        :connect-on-click="false"
        :select-nodes-on-drag="false"
        :selection-key-code="false"
    >
        <template #node-CONTENT_NODE="nodeProps">
            <ContentNode v-bind="nodeProps" :layer="layer"/>
        </template>

        <template #edge-CONTENT_EDGE="edgeProps">
            <ContentEdge v-bind="edgeProps" :layer="layer"/>
        </template>
    </VueFlow>
</template>

<style scoped>
.vue-flow.notCurrent,
.vue-flow.notCurrent *,
.vue-flow.invisible :deep(.vue-flow__pane) * {
    pointer-events: none !important;
}

.vue-flow.invisible {
    opacity: 0;
}

.vue-flow.current.visible {
    opacity: calc(1 * v-bind(layerOpacity));
}

.vue-flow.notCurrent.visible {
    opacity: calc(0.6 * v-bind(layerOpacity));
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

:deep(.vue-flow__pane.dragged-view) {
    cursor: default;
}
</style>
