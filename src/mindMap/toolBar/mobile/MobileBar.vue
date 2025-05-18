<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";
import {ref} from "vue";
import LayerMenu from "@/mindMap/layer/LayerMenu.vue";

const {
    canUndo,
    canRedo,
    undo,
    redo,
    fitView,
    defaultMouseAction,
    toggleDefaultMouseAction,
    canMultiSelect,
    toggleMultiSelect,

    selectAll,

    copy,
    cut,
    paste,
} = useMindMap()

const layersMenuOpen = ref(false)
</script>

<template>
    <div style="z-index: 5; max-width: 100%; position: absolute; top: 0; left: 0;">
        <button @click="copy">copy</button>
        <button @click="cut">cut</button>
        <button @click="paste">paste</button>

        <button @click="selectAll()">selectAll</button>
    </div>

    <div style="z-index: 5; width: 100%; position: absolute; bottom: 0; height: 3rem; line-height: 3rem; vertical-align: center; display: flex; justify-content: space-around;">
        <button @click="fitView()">fit</button>
        <button @click="toggleDefaultMouseAction">{{ defaultMouseAction }}</button>
        <button @click="toggleMultiSelect">multiselect: {{ canMultiSelect }}</button>

        <button :disabled="!canUndo" @click="undo">undo</button>
        <button :disabled="!canRedo" @click="redo">redo</button>

        <button @click="layersMenuOpen = !layersMenuOpen">layers</button>
    </div>

    <div v-show="layersMenuOpen" style="z-index: 5; position: absolute; bottom: 3rem; right: 0; height: calc(100% - 3rem); width: max(40vw, 20rem);">
        <LayerMenu/>
    </div>
</template>
