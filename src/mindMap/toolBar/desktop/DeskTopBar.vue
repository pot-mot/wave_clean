<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";
import LayerMenu from "@/mindMap/layer/LayerMenu.vue";

const {
    canUndo,
    canRedo,
    undo,
    redo,
    fitView,
    defaultMouseAction,
    toggleDefaultMouseAction,
} = useMindMap()
</script>

<template>
    <div style="z-index: 5; position: absolute; top: 0; left: 0; height: 3rem; line-height: 3rem; vertical-align: center; display: flex; justify-content: space-around;">
        <button :disabled="!canUndo" @click="undo">undo</button>
        <button :disabled="!canRedo" @click="redo">redo</button>
        <button @click="fitView()">fit</button>
        <button @click="toggleDefaultMouseAction">{{ defaultMouseAction }}</button>
    </div>

    <div style="z-index: 5; position: absolute; top: 0; right: 0; max-height: 100%; overflow-y: scroll;">
        <LayerMenu/>
    </div>
</template>

