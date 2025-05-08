<script setup lang="ts">
import {MindMapLayer, useMindMap} from "@/mindMap/useMindMap.ts";
import LayerView from "@/mindMap/layer/LayerView.vue";

const {
    layers,
    addLayer,
    removeLayer,
    toggleLayer,
    changeLayerVisible,
} = useMindMap()

const toggleLayerVisible = (layer: MindMapLayer) => {
    changeLayerVisible(layer.id, !layer.visible)
}
</script>

<template>
    <div class="layer-menu">
        <button @click="addLayer">add</button>

        <div v-for="layer in layers" class="layer-menu-item" @click="toggleLayer(layer.id)">
            <div>
                <LayerView/>
            </div>
            <input v-model="layer.name">
            <button @click.stop="toggleLayerVisible(layer)">{{ layer.visible ? 'show' : 'hide' }}</button>
            <button @click.stop="removeLayer(layer.id)">delete</button>
        </div>
    </div>
</template>

<style scoped>
.layer-menu {
    height: 100%;
    width: 100%;
}

.layer-menu-item {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
}
</style>
