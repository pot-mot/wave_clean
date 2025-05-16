<script setup lang="ts">
import {MindMapLayer, useMindMap} from "@/mindMap/useMindMap.ts";
import LayerView from "@/mindMap/layer/LayerView.vue";
import {computed, onMounted, ref, useTemplateRef} from "vue";
import {debounce} from "lodash";

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

onMounted(() => {
    for (let i = 0; i < 20; i++) {
        addLayer()
    }
})

const lastLayer = computed(() => layers[layers.length - 1])

const toggleLayerVisible = (layer: MindMapLayer) => {
    changeLayerVisible(layer.id, !layer.visible)
}

const handleLayerNameChange = (layer: MindMapLayer, e: Event) => {
    if (e.target instanceof HTMLInputElement) {
        changeLayerData(layer.id, {name: e.target.value})
        e.target.blur()
    }
}

// 拖拽行为和状态
const isDragging = ref(false)
const draggingLayer = ref<{ layer: MindMapLayer, index: number }>()
const overTarget = ref<{ layer: MindMapLayer, index: number, type: 'layer' | 'gap' }>()

const scrollWrapper = useTemplateRef<HTMLDivElement>("scrollWrapper")
const scrollTop = ref(0)

const handleScroll = () => {
    scrollTop.value = scrollWrapper.value?.scrollTop ?? 0
}

let dragStartElementXY: { x: number, y: number } | undefined = undefined
let dragStartClientXY: { x: number, y: number } | undefined = undefined
const dragMoveClientXY = ref<{ x: number, y: number }>()

const resetDragState = () => {
    draggingLayer.value = undefined
    overTarget.value = undefined
    dragStartElementXY = undefined
    dragStartClientXY = undefined
    dragMoveClientXY.value = undefined
}

const reverseIndex = (reversedIndex: number): number => {
    return layers.length - 1 - reversedIndex
}

const handleDragStartByMouse = (index: number, layer: MindMapLayer, event: MouseEvent) => {
    if (!scrollWrapper.value) return

    event.preventDefault()

    draggingLayer.value = {index, layer}
    isDragging.value = true

    const target = event.target as HTMLElement
    dragStartElementXY = {
        x: target.offsetLeft,
        y: target.offsetTop,
    }
    dragStartClientXY = {
        x: event.clientX + scrollWrapper.value.scrollLeft,
        y: event.clientY + scrollWrapper.value.scrollTop,
    }

    document.documentElement.addEventListener("mousemove", handleDraggingByMouse)
    document.documentElement.addEventListener("mouseup", handleDragEndByMouse)
}

const handleDraggingByMouse = (event: MouseEvent) => {
    if (isDragging.value && scrollWrapper.value && dragStartClientXY !== undefined && dragStartElementXY !== undefined) {
        dragMoveClientXY.value = {
            x: dragStartElementXY.x + event.clientX - dragStartClientXY.x,
            y: dragStartElementXY.y + event.clientY - dragStartClientXY.y,
        }
    }
}

const handleDragEndByMouse = () => {
    document.documentElement.removeEventListener("mousemove", handleDraggingByMouse)
    document.documentElement.removeEventListener("mouseup", handleDragEndByMouse)

    if (isDragging.value) {
        isDragging.value = false

        if (draggingLayer.value && overTarget.value && draggingLayer.value.layer.id !== overTarget.value.layer.id) {
            // if (overTarget.value.type === 'layer') {
            //     swapLayer(reverseIndex(draggingLayer.value.index), reverseIndex(overTarget.value.index))
            // } else if (overTarget.value.type === 'gap') {
            //     dragLayer(reverseIndex(draggingLayer.value.index), reverseIndex(overTarget.value.index))
            // }
        }
    }

    resetDragState()
}

const handleDragStartByTouch = (index: number, layer: MindMapLayer, event: TouchEvent) => {
    if (!scrollWrapper.value) return

    event.preventDefault()

    draggingLayer.value = {index, layer}
    isDragging.value = true

    const target = event.target as HTMLElement
    dragStartElementXY = {
        x: target.offsetLeft,
        y: target.offsetTop,
    }
    dragStartClientXY = {
        x: event.touches[0].clientX + scrollWrapper.value.scrollLeft,
        y: event.touches[0].clientY + scrollWrapper.value.scrollTop,
    }

    document.documentElement.addEventListener("touchmove", handleDraggingByTouch)
    document.documentElement.addEventListener("touchend", handleDragEndByMouseByTouch)
    document.documentElement.addEventListener("touchcancel", handleDragEndByMouseByTouch)
}

const handleDraggingByTouch = (event: TouchEvent) => {
    if (isDragging.value && scrollWrapper.value && dragStartClientXY !== undefined && dragStartElementXY !== undefined) {
        dragMoveClientXY.value = {
            x: dragStartElementXY.x + event.changedTouches[0].clientX - dragStartClientXY.x,
            y: dragStartElementXY.y + event.changedTouches[0].clientY - dragStartClientXY.y,
        }
    }
}

const handleDragEndByMouseByTouch = () => {
    document.documentElement.removeEventListener("touchmove", handleDraggingByTouch)
    document.documentElement.removeEventListener("touchend", handleDragEndByMouseByTouch)
    document.documentElement.removeEventListener("touchcancel", handleDragEndByMouseByTouch)

    if (isDragging.value) {
        isDragging.value = false

        if (draggingLayer.value && overTarget.value && draggingLayer.value.layer.id !== overTarget.value.layer.id) {
            // if (overTarget.value.type === 'layer') {
            //     swapLayer(reverseIndex(draggingLayer.value.index), reverseIndex(overTarget.value.index))
            // } else if (overTarget.value.type === 'gap') {
            //     dragLayer(reverseIndex(draggingLayer.value.index), reverseIndex(overTarget.value.index))
            // }
        }
    }

    resetDragState()
}

const handleLayerDragEnter = debounce((index: number, layer: MindMapLayer) => {
    if (!isDragging.value) return
    if (overTarget.value?.layer.id !== layer.id) {
        overTarget.value = {index, layer, type: 'layer'}
    }
}, 100)

const handleGapDragEnter = debounce((index: number, layer: MindMapLayer) => {
    if (!isDragging.value) return
    if (overTarget.value?.layer.id !== layer.id) {
        overTarget.value = {index, layer, type: 'gap'}
    }
}, 100)

const handleMouseLeave = () => {
    if (isDragging.value) {
        overTarget.value = undefined
    }
}

// 当拖拽至两端时，触发滚动
const canDragUp = computed(() => {
    if (!scrollWrapper.value) return false
    if (!isDragging.value) return false
    return scrollTop.value > 0
})
const canDragDown = computed(() => {
    if (!scrollWrapper.value) return false
    if (!isDragging.value) return false
    return scrollTop.value < (scrollWrapper.value.scrollHeight - scrollWrapper.value.clientHeight)
})

let dragUpTimer: number | undefined = undefined
const startDragUp = () => {
    dragUpTimer = setInterval(() => {
        if (!canDragUp.value) {
            clearInterval(dragUpTimer)
            return
        }
        if (!scrollWrapper.value) return
        scrollWrapper.value?.scrollBy({top: -20})
    }, 50)
}
const stopDragUp = () => {
    clearInterval(dragUpTimer)
}

let dragDownTimer: number | undefined = undefined
const startDragDown = () => {
    dragDownTimer = setInterval(() => {
        if (!canDragDown.value) {
            clearInterval(dragDownTimer)
            return
        }
        if (!scrollWrapper.value) return
        scrollWrapper.value.scrollBy({top: 20})
    }, 50)
}
const stopDragDown = () => {
    clearInterval(dragDownTimer)
}
</script>

<template>
    <div class="layer-menu">
        <div class="layer-menu-header">
            <button @click="addLayer">add</button>
            {{ draggingLayer?.layer.id }}
            {{ overTarget?.layer.id }}
        </div>

        <div
            class="layer-menu-container"
            @mouseleave="handleMouseLeave"
        >
            <div
                v-if="isDragging && draggingLayer && dragMoveClientXY"
                class="layer-menu-item dragged-view"
                :style="{
                        top: dragMoveClientXY.y + 'px',
                        left: dragMoveClientXY.x + 'px',
                    }">
                <div class="layer-menu-item-view">
                    <LayerView/>
                </div>
                <span
                    class="layer-menu-item-name"
                >
                        {{ draggingLayer.layer.name }}
                    </span>
            </div>

            <div class="layer-menu-item-scroll-wrapper" ref="scrollWrapper" @scroll="handleScroll">
                <div
                    class="layer-menu-item-gap"
                    :class="{
                        over: overTarget?.index === layers.length && overTarget?.type === 'gap'
                    }"
                    @mouseenter="handleGapDragEnter(layers.length, lastLayer)"
                    @touchmove="handleLayerDragEnter(layers.length, lastLayer)"
                />

                <template v-for="(layer, index) in layers.slice().reverse()" :key="layer.id">
                    <div
                        class="layer-menu-item"
                        :class="{
                            current: currentLayer.id === layer.id,
                            dragged: draggingLayer?.index === index,
                            over: overTarget?.index === index && overTarget?.type === 'layer'
                        }"
                        @click="toggleLayer(layer.id)"
                        @mousedown="handleDragStartByMouse(index, layer, $event)"
                        @mouseenter="handleLayerDragEnter(index, layer)"
                        @touchstart="handleDragStartByTouch(index, layer, $event)"
                        @touchmove="handleLayerDragEnter(index, layer)"
                    >
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

                    <div
                        class="layer-menu-item-gap"
                        :class="{
                            over: overTarget?.index === index && overTarget?.type === 'gap'
                        }"
                        @mouseenter="handleGapDragEnter(index, layer)"
                        @touchmove="handleLayerDragEnter(index, layer)"
                    />
                </template>
            </div>

            <div
                v-if="canDragUp"
                class="layer-menu-item-scroll-handle"
                style="position: absolute; top: 0; left: 0; right: 0;"

                @mouseenter="startDragUp"
                @mouseleave="stopDragUp"
                @mouseup="stopDragUp"

                @touchstart="startDragUp"
                @touchstop="stopDragUp"
                @touchcancel="stopDragUp"
            >
                <div>上</div>
            </div>

            <div
                v-if="canDragDown"
                class="layer-menu-item-scroll-handle"
                style="position: absolute; bottom: 0; left: 0; right: 0;"

                @mouseenter="startDragDown"
                @mouseleave="stopDragDown"
                @mouseup="stopDragDown"

                @touchstart="startDragDown"
                @touchstop="stopDragDown"
                @touchcancel="stopDragDown"
            >
                <div>下</div>
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
    position: relative;
    height: calc(100% - 2rem);
    width: max(100%, 20rem);
}

.layer-menu-item-scroll-wrapper {
    position: relative;
    height: 100%;
    width: 100%;
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

.layer-menu-item.dragged {
    opacity: 0;
}

.layer-menu-item.over {
    outline: 2px dashed var(--primary-color);
    outline-offset: -2px;
}

.layer-menu-item.dragged-view {
    position: absolute;
    opacity: 0.8;
    pointer-events: none;
    z-index: 1000000;
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
    font-size: 0.9rem;

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

.layer-menu-item-gap {
    height: 0.6rem;
}

.layer-menu-item-scroll-handle {
    height: 2rem;
    z-index: 1000000;
}

.layer-menu-item-gap.over {
    background-color: var(--primary-color);
    opacity: 0.6;
    cursor: default;
}
</style>
