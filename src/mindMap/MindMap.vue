<script setup lang="ts">
import {VueFlow} from "@vue-flow/core";
import ContentNode from "@/mindMap/ContentNode.vue";
import ContentEdge from "@/mindMap/ContentEdge.vue";
import {MIND_MAP_ID, useMindMap} from "@/mindMap/useMindMap.ts";
import {MiniMap} from "@vue-flow/minimap";
import {Background} from "@vue-flow/background";

useMindMap()
</script>

<template>
    <VueFlow
        :id="MIND_MAP_ID"
        tabindex="-1"
        style="width: 100%; height: 100%;"
        :style="{ backgroundColor: 'var(--background-color)' }"
    >
        <Background pattern-color="var(--border-color)"/>
        <MiniMap pannable zoomable/>

        <template #node-CONTENT_NODE="nodeProps">
            <ContentNode v-bind="nodeProps"/>
        </template>

        <template #edge-CONTENT_EDGE="edgeProps">
            <ContentEdge v-bind="edgeProps"/>
        </template>
    </VueFlow>
</template>
