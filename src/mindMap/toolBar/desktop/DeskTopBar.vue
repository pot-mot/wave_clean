<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";
import LayerMenu from "@/mindMap/layer/LayerMenu.vue";
import {ref} from "vue";

const {
    canUndo,
    canRedo,
    undo,
    redo,
    fitView,
    defaultMouseAction,
    toggleDefaultMouseAction,
} = useMindMap()

const layersMenuOpen = ref(false)
</script>

<template>
    <div style="z-index: 5; position: absolute; top: 0; left: 0; height: 3rem; line-height: 3rem; vertical-align: center; display: flex; justify-content: space-around;">
        <button :disabled="!canUndo" @click="undo">undo</button>
        <button :disabled="!canRedo" @click="redo">redo</button>
        <button @click="fitView()">fit</button>
        <button @click="toggleDefaultMouseAction">{{ defaultMouseAction }}</button>
    </div>

    <div style="z-index: 5; position: absolute; top: 0; right: 0; height: 3rem;">
        <button @click="layersMenuOpen = !layersMenuOpen">layers</button>
    </div>

    <div v-show="layersMenuOpen" style="z-index: 5; position: absolute; top: 3rem; right: 0; height: calc(100% - 3rem); width: max(20vw, 20rem);">
        <LayerMenu/>
    </div>
</template>

