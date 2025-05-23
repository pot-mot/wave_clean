<script setup lang="ts">
import {MindMapLayer, useMindMap} from "@/mindMap/useMindMap.ts";
import LayerView from "@/mindMap/layer/LayerView.vue";
import IconDelete from "@/icons/IconDelete.vue";
import IconVisible from "@/icons/IconVisible.vue";
import IconAdd from "@/icons/IconAdd.vue";
import IconInvisible from "@/icons/IconInvisible.vue";
import DragList from "@/list/DragList.vue";
import {computed} from "vue";

const {
    layers,
    currentLayer,
    addLayer,
    removeLayer,
    toggleLayer,
    changeLayerVisible,
    changeLayerData,
    swapLayer,
    dragLayer,
} = useMindMap()

const toggleLayerVisible = (layer: MindMapLayer) => {
    changeLayerVisible(layer.id, !layer.visible)
}

const reversedLayers = computed(() => {
    return layers.slice().reverse()
})

const handleLayerNameChange = (layer: MindMapLayer, e: Event) => {
    if (e.target instanceof HTMLInputElement) {
        changeLayerData(layer.id, {name: e.target.value})
        e.target.blur()
    }
}


const reverseIndex = (index: number): number => {
    return layers.length - 1 - index
}
const reverseDragTargetIndex = (index: number) => {
    if (index === layers.length) {
        return 0
    }
    return layers.length - index
}


const handleDrag = (a: number, b: number) => {
    dragLayer(reverseIndex(a), reverseDragTargetIndex(b))
}

const handleSwap = (a: number, b: number) => {
    swapLayer(reverseIndex(a), reverseIndex(b))
}
</script>

<template>
    <div class="layer-menu">
        <div class="layer-menu-header">
            <button @click="addLayer" class="layer-add-button">
                <IconAdd/>
            </button>
        </div>

        <DragList
            :data="reversedLayers"
            :current-item="currentLayer"
            :to-key="layer => layer.id"
            @drag="handleDrag"
            @swap="handleSwap"
            @remove="it => removeLayer(it.id)"
        >
            <template #default="{item: layer}">
                <div class="layer-menu-item" @click="toggleLayer(layer.id)">
                    <button
                        @click.stop="toggleLayerVisible(layer)"
                        class="layer-menu-item-visible"
                    >
                        <IconVisible v-if="layer.visible"/>
                        <IconInvisible v-else/>
                    </button>
                    <div class="layer-menu-item-view">
                        <LayerView :layer="layer"/>
                    </div>
                    <input
                        :value="layer.name"
                        class="layer-menu-item-name"
                        @change="(e) => handleLayerNameChange(layer, e)"
                    >
                    <button
                        @click.stop="removeLayer(layer.id)"
                        class="layer-menu-item-delete"
                    >
                        <IconDelete/>
                    </button>
                </div>
            </template>

            <template #dragView="{data: {item: layer}}">
                <div class="layer-menu-item-drag-view">
                    <div class="layer-menu-item-view">
                        <LayerView :layer="layer"/>
                    </div>
                    <input
                        class="layer-menu-item-name"
                        :value="layer.name"
                    />
                </div>
            </template>
        </DragList>
    </div>
</template>

<style scoped>
.layer-menu {
    height: 100%;
    width: 100%;
    background-color: var(--background-color);
    transition: background-color 0.5s;
}

.layer-menu-header {
    height: 2rem;
}

.layer-add-button {
    width: 100%;
    height: 100%;
    border: none;
    background-color: var(--background-color);
    transition: background-color 0.5s ease;
}

.layer-add-button:hover {
    background-color: var(--background-color-hover);
}

.layer-menu-item {
    height: 5rem;
    width: 100%;
    display: grid;
    grid-gap: 0.5rem;
    grid-template-columns: 1.5rem 4rem calc(100% - 8.5rem) 1.5rem;
    user-select: none;
}

.layer-menu-item-drag-view {
    position: relative;
    height: 5rem;
    width: 100%;
    padding: 0 2rem;
    display: grid;
    grid-template-columns: 4rem calc(100% - 8.5rem);
    grid-gap: 0.5rem;
    opacity: 0.8;
    z-index: var(--top-z-index);
    background-color: var(--primary-color);
}

.layer-menu-item-view {
    height: 4rem;
    width: 4rem;
    margin-top: 0.5rem;
}

.layer-menu-item-visible,
.layer-menu-item-delete {
    height: 1.5rem;
    width: 1.5rem;
    margin-top: 1.75rem;
}

.layer-menu-item-name {
    height: 1.5rem;
    line-height: 1.5rem;
    margin-top: 1.75rem;
    font-size: 0.9rem;
    pointer-events: none;
    user-select: none;
    background-color: transparent;
    border: none;
    color: var(--text-color);
}

.current .layer-menu-item-name {
    pointer-events: all;
    cursor: default;
    color: var(--background-color)
}

.layer-menu-item-name:focus {
    background-color: var(--background-color);
    color: var(--text-color);
    border: var(--border);
    padding: 0 0.5rem;
    outline: none;
    cursor: text;
}
</style>
