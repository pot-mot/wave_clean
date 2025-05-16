<script setup lang="ts">
import {MindMapLayer, useMindMap} from "@/mindMap/useMindMap.ts";
import LayerView from "@/mindMap/layer/LayerView.vue";

const {
    layers,
    currentLayer,
    addLayer,
    removeLayer,
    toggleLayer,
    changeLayerVisible,
    changeLayerData,
} = useMindMap()

const toggleLayerVisible = (layer: MindMapLayer) => {
    changeLayerVisible(layer.id, !layer.visible)
}

const handleLayerNameChange = (layer: MindMapLayer, e: Event) => {
    if (e.target instanceof HTMLInputElement) {
        changeLayerData(layer.id, {name: e.target.value})
        e.target.blur()
    }
}
</script>

<template>
    <div class="layer-menu">
        <div class="layer-menu-header">
            <button @click="addLayer">add</button>
        </div>

        <div class="layer-menu-container">
            <div v-for="layer in layers.slice().reverse()" class="layer-menu-item" :class="{current: currentLayer.id === layer.id}"
                 @click="toggleLayer(layer.id)">
                <div class="layer-menu-item-view">
                    <LayerView/>
                </div>
                <input
                    :value="layer.name"
                    class="layer-menu-item-name"
                    @change="(e) => handleLayerNameChange(layer, e)"
                >
                <button
                    @click.stop="toggleLayerVisible(layer)"
                    class="layer-menu-item-visible"
                >
                    {{ layer.visible ? 'show' : 'hide' }}
                </button>
                <button
                    v-if="currentLayer.id !== layer.id"
                    @click.stop="removeLayer(layer.id)"
                    class="layer-menu-item-delete"
                >
                    delete
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.layer-menu {
    height: 100%;
    width: 100%;
}

.layer-menu-header {
    height: 2rem;
}

.layer-menu-container {
    height: calc(100% - 2rem);
    width: max(100%, 20rem);
    overflow-x: auto;
    overflow-y: auto;
}

.layer-menu-item {
    position: relative;
    background-color: var(--background-color);
    height: 6rem;
    width: 100%;
}

.layer-menu-item.current {
    background-color: var(--primary-color);
}

.layer-menu-item-visible {
    position: absolute;
    top: 2.5rem;
    left: 0.5rem;
    height: 1rem;
    width: 2rem;
}

.layer-menu-item-view {
    position: absolute;
    top: 0.5rem;
    left: 3rem;
    height: 5rem;
    width: 5rem;
}

.layer-menu-item-name {
    pointer-events: none;
}

.current .layer-menu-item-name {
    pointer-events: initial;
}

.layer-menu-item-name {
    position: absolute;
    top: 2.5rem;
    left: 8.5rem;
    height: 1rem;
    width: 9rem;

    background-color: transparent;
    border: none;
}

.layer-menu-item-name:focus {
    background-color: var(--background-color);
    border: var(--border);
}

.layer-menu-item-delete {
    position: absolute;
    top: 2.5rem;
    left: 18rem;
    height: 1rem;
    width: 2rem;
}
</style>
