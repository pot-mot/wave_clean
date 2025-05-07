<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";

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
} = useMindMap()
</script>

<template>
    <div style="z-index: 5; width: 100%; position: absolute; bottom: 0; height: 3rem; line-height: 3rem; vertical-align: center; display: flex; justify-content: space-around;">
        <button @click="fitView()">fit</button>
        <button @click="toggleDefaultMouseAction">{{ defaultMouseAction }}</button>
        <button @click="toggleMultiSelect">multiselect: {{ canMultiSelect }}</button>

        <button :disabled="!canUndo" @click="undo">undo</button>
        <button :disabled="!canRedo" @click="redo">redo</button>
    </div>
</template>
