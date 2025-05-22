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
    <div class="toolbar top-left">
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

    <div class="toolbar top-right">
        <button @click="layersMenuOpen = !layersMenuOpen" :class="{enable: layersMenuOpen}">
            <IconLayer/>
        </button>
    </div>

    <div
        class="toolbar file-menu"
        :class="{open: fileMenuOpen}"
        tabindex="-1"
        @keydown.esc="fileMenuOpen = false"
    >
        <FileMenu/>
    </div>

    <div
        class="toolbar layer-menu"
        :class="{open: layersMenuOpen}"
        tabindex="-1"
        @keydown.esc="layersMenuOpen = false"
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

.toolbar.file-menu,
.toolbar.layer-menu {
    top: 2.5rem;
    height: calc(100% - 3rem);
    width: max(20vw, 20rem);
    border-top: var(--border);
    border-bottom: var(--border);
    transition: transform 0.5s ease, opacity 0.5s ease;
    pointer-events: none;
}
.toolbar.file-menu.open,
.toolbar.layer-menu.open {
    pointer-events: all;
}

.toolbar.file-menu {
    left: 0;
    border-right: var(--border);
    opacity: 0;
    transform: translateX(-100%);
}
.toolbar.file-menu.open {
    opacity: 1;
    transform: translateX(0);
}

.toolbar.layer-menu {
    right: 0;
    border-left: var(--border);
    opacity: 0;
    transform: translateX(100%);
}
.toolbar.layer-menu.open {
    opacity: 1;
    transform: translateX(0);
}
</style>

