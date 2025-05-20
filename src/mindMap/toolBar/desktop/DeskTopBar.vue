<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";
import LayerMenu from "@/mindMap/layer/LayerMenu.vue";
import {ref} from "vue";
import FileMenu from "@/mindMap/file/FileMenu.vue";

const {
    save,

    canUndo,
    canRedo,
    undo,
    redo,
    fitView,
    defaultMouseAction,
    toggleDefaultMouseAction,
} = useMindMap()

const fileMenuOpen = ref(false)

const layersMenuOpen = ref(false)
</script>

<template>
    <div style="z-index: 5; position: absolute; top: 0; height: 3rem; line-height: 3rem; vertical-align: center; display: flex; justify-content: space-around;">
        <button @click="fileMenuOpen = !fileMenuOpen">menu</button>
        <button @click="save">save</button>

        <button :disabled="!canUndo" @click="undo">undo</button>
        <button :disabled="!canRedo" @click="redo">redo</button>
        <button @click="fitView()">fit</button>
        <button @click="toggleDefaultMouseAction">{{ defaultMouseAction }}</button>
    </div>

    <div style="z-index: 5; position: absolute; top: 0; right: 0; height: 3rem;">
        <button @click="layersMenuOpen = !layersMenuOpen">layers</button>
    </div>

    <div v-show="fileMenuOpen" style="z-index: 5; position: absolute; top: 3rem; left: 0; height: calc(100% - 3rem); width: max(20vw, 20rem);  background-color: var(--mark-color);">
        <FileMenu/>
    </div>

    <div v-show="layersMenuOpen" style="z-index: 5; position: absolute; top: 3rem; right: 0; height: calc(100% - 3rem); width: max(20vw, 20rem);  background-color: var(--mark-color);">
        <LayerMenu/>
    </div>
</template>

