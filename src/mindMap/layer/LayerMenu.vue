<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";
import LayerView from "@/mindMap/layer/LayerView.vue";
import IconDelete from "@/components/icons/IconDelete.vue";
import IconVisible from "@/components/icons/IconVisible.vue";
import IconAdd from "@/components/icons/IconAdd.vue";
import IconInvisible from "@/components/icons/IconInvisible.vue";
import DragList from "@/components/list/DragList.vue";
import {computed} from "vue";
import CollapseDetail from "@/components/collapse/CollapseDetail.vue";
import {type MindMapLayer} from "@/mindMap/layer/MindMapLayer.ts";
import IconLock from "@/components/icons/IconLock.vue";
import IconLockOpen from "@/components/icons/IconLockOpen.vue";
import IconLayerMerge from "@/components/icons/IconLayerMerge.vue";
import IconOnion from "@/components/icons/IconOnion.vue";
import {useMindMapMetaStore} from "@/mindMap/meta/MindMapMetaStore.ts";
import {sendConfirm} from "@/components/confirm/confirmApi.ts";
import {translate} from "@/store/i18nStore.ts";

const {
    layers,
    currentLayer,
    addLayer,
    removeLayer,
    mergeLayer,
    toggleLayer,
    changeLayerVisible,
    changeLayerLock,
    changeLayerData,
    swapLayer,
    dragLayer,
} = useMindMap()

const {
    meta
} = useMindMapMetaStore()

const toggleLayerVisible = (layer: MindMapLayer) => {
    changeLayerVisible(layer.id, !layer.visible)
}

const toggleLayerLock = (layer: MindMapLayer) => {
    changeLayerLock(layer.id, !layer.lock)
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

const handleDelete = async (key: string) => {
    if (layers.length <= 1) return
    await sendConfirm({
        title: translate({key: "delete_confirm_title", args: [translate('layer')]}),
        content: translate({key: "delete_confirm_content", args: [translate('layer')]}),
        onConfirm: () => {
            removeLayer(key)
        }
    })
}

const toggleOnion = () => {
    meta.value.onionEnabled = !meta.value.onionEnabled
}
</script>

<template>
    <div class="layer-menu">
        <div class="layer-menu-header">
            <button @click="addLayer" class="layer-add-button">
                <IconAdd/>
            </button>
            <button @click="toggleOnion" class="onion-toggle-button" :class="{enabled: meta.onionEnabled}">
                <IconOnion/>
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
            <template #default="{item: layer, index}">
                <CollapseDetail>
                    <template #head>
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
                        </div>
                    </template>

                    <template #body>
                        <div class="layer-menu-item-options">
                            <button
                                class="layer-menu-item-merge"
                                v-if="layers.length > 1 && (layers.length - 1 - index) !== 0"
                                @click.stop="mergeLayer(layers.length - 1 - index)"
                            >
                                <IconLayerMerge/>
                            </button>

                            <button
                                class="layer-menu-item-lock"
                                @click.stop="toggleLayerLock(layer)"
                            >
                                <template  v-if="layer.lock">
                                    <IconLock/>
                                </template>
                                <template v-else>
                                    <IconLockOpen/>
                                </template>
                            </button>

                            <button
                                class="layer-menu-item-delete"
                                :class="{disabled: layers.length <= 1}"
                                @click.stop="handleDelete(layer.id)"
                            >
                                <IconDelete/>
                            </button>
                        </div>
                    </template>
                </CollapseDetail>
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
    position: relative;
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
    grid-template-columns: 1.5rem 4rem calc(100% - 6.5rem);
    user-select: none;
}

.layer-menu-item-drag-view {
    position: relative;
    height: 5rem;
    width: 100%;
    padding-left: 2rem;
    padding-right: 1rem;
    display: grid;
    grid-template-columns: 4rem calc(100% - 4.5rem);
    grid-gap: 0.5rem;
    opacity: 0.8;
    background-color: var(--primary-color);
}

.layer-menu-item-view {
    height: 4rem;
    width: 4rem;
    margin-top: 0.5rem;
}

.layer-menu-item-visible {
    margin-top: 1.75rem;
    height: 1.5rem;
    width: 1.5rem;
}

.layer-menu-item-visible:hover {
    background-color: var(--background-color-hover);
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
    padding: 0 0.25rem;
    outline: none;
    cursor: text;
}


.layer-menu-item-options {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 0 0.5rem 0.5rem;
}

.layer-menu-item-options button {
    height: 1.5rem;
    min-width: 1.5rem;
    padding: 0 0.25rem;
}

.layer-menu-item-options button.disabled {
    background-color: var(--background-color-hover);
    cursor: not-allowed;
}

.layer-menu-item-options button:hover {
    background-color: var(--background-color-hover);
}

.onion-toggle-button {
    position: absolute;
    top: 0.2rem;
    right: 0.2rem;
    --icon-size: 1.2rem;
    cursor: pointer;
    padding: 0.2rem;
    border-radius: 0.25rem;
    border: none;
}

.onion-toggle-button:hover {
    background-color: var(--background-color-hover);
}

.onion-toggle-button.enabled {
    --icon-color: var(--primary-color);
}
</style>
