<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";
import LayerMenu from "@/mindMap/layer/LayerMenu.vue";
import {ref} from "vue";
import FileMenu from "@/mindMap/file/FileMenu.vue";
import IconSave from "@/icons/IconSave.vue";
import IconUndo from "@/icons/IconUndo.vue";
import IconRedo from "@/icons/IconRedo.vue";
import IconFit from "@/icons/IconFit.vue";
import IconMenu from "@/icons/IconMenu.vue";
import IconLayer from "@/icons/IconLayer.vue";
import IconDrag from "@/icons/IconDrag.vue";
import IconSelection from "@/icons/IconSelection.vue";

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
    <div
        class="toolbar top-left"
    >
        <button @click="fileMenuOpen = !fileMenuOpen" :class="{enable: fileMenuOpen}">
            <IconMenu/>
        </button>
        <button @click="save()">
            <IconSave/>
        </button>

        <button :disabled="!canUndo" @click="undo()" :class="{disabled: !canUndo}">
            <IconUndo/>
        </button>
        <button :disabled="!canRedo" @click="redo()" :class="{disabled: !canRedo}">
            <IconRedo/>
        </button>
        <button @click="fitView()">
            <IconFit/>
        </button>
        <button @click="toggleDefaultMouseAction()">
            <IconDrag v-if="defaultMouseAction === 'panDrag'"/>
            <IconSelection v-else-if="defaultMouseAction === 'selectionRect'"/>
        </button>
    </div>

    <div
        class="toolbar top-right"
    >
        <button @click="layersMenuOpen = !layersMenuOpen" :class="{enable: layersMenuOpen}">
            <IconLayer/>
        </button>
    </div>

    <div
        class="toolbar file-menu"
        v-show="fileMenuOpen"
    >
        <FileMenu/>
    </div>

    <div
        class="toolbar layer-menu"
        v-show="layersMenuOpen"
    >
        <LayerMenu/>
    </div>
</template>

<style scoped>
.toolbar {
    z-index: 5;
    position: absolute;
    background-color: var(--background-color);
}

.toolbar button {
    padding: 0 1rem;
    background-color: var(--background-color);
    border: none;
    cursor: pointer;
    transition: background-color 0.5s ease;
}

.toolbar button:hover {
    background-color: var(--background-color-hover);
}

.toolbar button.disabled {
    background-color: var(--background-color);
    opacity: 0.6;
    cursor: not-allowed;
}

.toolbar button.enable {
    background-color: var(--primary-color);
    color: var(--background-color);
    --icon-color: var(--background-color);
    border-radius: 0;
}

.toolbar.top-left {
    top: 0;
    left: 0;
    height: 2rem;
    line-height: 2rem;
    display: flex;
    justify-content: space-around;
    border-right: var(--border);
    border-bottom: var(--border);
}

.toolbar.top-right {
    top: 0;
    right: 0;
    height: 2rem;
    line-height: 2rem;
    display: flex;
    justify-content: space-around;
    border-left: var(--border);
    border-bottom: var(--border);
}

.toolbar.file-menu {
    top: 2.5rem;
    left: 0;
    height: calc(100% - 3rem);
    width: max(20vw, 20rem);
    background-color: var(--mask-color);
    border-top: var(--border);
    border-bottom: var(--border);
    border-right: var(--border);
}

.toolbar.layer-menu {
    top: 2.5rem;
    right: 0;
    height: calc(100% - 3rem);
    width: max(20vw, 20rem);
    background-color: var(--mask-color);
    border-top: var(--border);
    border-bottom: var(--border);
    border-left: var(--border);
}
</style>

