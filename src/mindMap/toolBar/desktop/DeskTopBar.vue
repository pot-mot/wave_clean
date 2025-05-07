<script setup lang="ts">
import {Panel} from "@vue-flow/core";
import {useMindMap} from "@/mindMap/useMindMap.ts";

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
    <Panel position="top-left">
        <button :disabled="!canUndo" @click="undo">undo</button>
        <button :disabled="!canRedo" @click="redo">redo</button>
        <button @click="fitView()">fit</button>
        <button @click="toggleDefaultMouseAction">{{ defaultMouseAction }}</button>
    </Panel>
</template>

