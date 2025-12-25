<script setup lang="ts">
import {VueFlow} from "@vue-flow/core";
import ContentNode from "@/mindMap/node/ContentNode.vue";
import ContentEdge from "@/mindMap/edge/ContentEdge.vue";
import {useMindMap} from "@/mindMap/useMindMap.ts";
import {computed} from "vue";
import {type MindMapLayer} from "@/mindMap/layer/MindMapLayer.ts";
import {useMindMapStore} from "@/store/mindMapStore.ts";

const props = defineProps<{
    layer: MindMapLayer,
    index: number,
}>()

const {meta} = useMindMapStore()

const {currentLayer, initLayer, currentLayerIndex} = useMindMap()

const isCurrent = computed(() => {
    return props.layer.id === currentLayer.value.id
})

const layerOpacity = computed(() => {
    if (isCurrent.value) {
        return props.layer.opacity
    } else if (meta.value.onionEnabled && currentLayerIndex.value !== -1) {
        const diff = Math.abs(currentLayerIndex.value - props.index)
        return props.layer.opacity * Math.max(0.1, 0.8 - (diff * 0.2))
    } else {
        return props.layer.opacity * 0.5
    }
})

initLayer(props.layer)
</script>

<template>
    <VueFlow
        :id="layer.vueFlow.id"
        :class="{
            current: isCurrent,
            notCurrent: !isCurrent,
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
        :delete-key-code="() => false"

        no-drag-class-name="noDrag"
        no-wheel-class-name="noWheel"
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

.vue-flow.visible {
    opacity: v-bind(layerOpacity);
}

:deep(.vue-flow__pane.draggable) {
    cursor: default;
}

:deep(.vue-flow__pane.dragged-view) {
    cursor: default;
}

:deep(.vue-flow__selection) {
    border: var(--border);
    border-color: var(--primary-color);
    background-color: var(--primary-color-opacity-background);
}
</style>
