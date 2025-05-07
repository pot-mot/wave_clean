<script setup lang="ts">
import {Panel} from "@vue-flow/core";
import {MindMapLayer, useMindMap} from "@/mindMap/useMindMap.ts";

const {
    canUndo,
    canRedo,
    undo,
    redo,
    fitView,
    defaultMouseAction,
    toggleDefaultMouseAction,

    currentLayer,
    layers,
    addLayer,
    removeLayer,
    toggleLayer,
} = useMindMap()

const toggleLayerVisible = (layer: MindMapLayer) => {
    layer.visible = !layer.visible
}
</script>

<template>
    <Panel position="top-left">
        <button :disabled="!canUndo" @click="undo">undo</button>
        <button :disabled="!canRedo" @click="redo">redo</button>
        <button @click="fitView()">fit</button>
        <button @click="toggleDefaultMouseAction">{{ defaultMouseAction }}</button>

        {{ currentLayer.id }}
        <template v-for="layer in layers">
            <button @click="toggleLayer(layer.id)">{{ layer.id }}</button>
            <button @click="toggleLayerVisible(layer)">{{ layer.visible ? 'show' : 'hide' }}</button>
            <button @click="removeLayer(layer.id)">delete</button>
        </template>
        <button @click="addLayer">add</button>
    </Panel>
</template>

