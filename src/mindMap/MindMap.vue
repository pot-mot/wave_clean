<script setup lang="ts">
import {Panel, VueFlow} from "@vue-flow/core";
import ContentNode from "@/mindMap/ContentNode.vue";
import ContentEdge from "@/mindMap/ContentEdge.vue";
import {MIND_MAP_ID, useMindMap} from "@/mindMap/useMindMap.ts";
import {MiniMap} from "@vue-flow/minimap";
import {Background} from "@vue-flow/background";

const {isTouchDevice, canUndo, canRedo, undo, redo, fitView, canMultiSelect, disableMultiSelect, enableMultiSelect} = useMindMap()

const toggleMultiSelect = () => {
    if (canMultiSelect.value) {
        disableMultiSelect()
    } else {
        enableMultiSelect()
    }
}
</script>

<template>
    <VueFlow
        :id="MIND_MAP_ID"
        tabindex="-1"
        style="width: 100%; height: 100%;"
        :style="{ backgroundColor: 'var(--background-color)' }"
    >
        <Background pattern-color="var(--border-color)"/>
        <MiniMap v-if="!isTouchDevice" pannable zoomable style="background-color: var(--background-color)"/>

        <Panel position="top-left">
            <button :disabled="!canUndo" @click="undo">undo</button>
            <button :disabled="!canRedo" @click="redo">redo</button>
            <button @click="fitView()">fit</button>
            <button v-if="isTouchDevice" @click="toggleMultiSelect">{{ canMultiSelect }}multiselect</button>
        </Panel>

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
</style>
