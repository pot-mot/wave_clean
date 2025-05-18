<script setup lang="ts">
import {MindMapLayer, useMindMap} from "@/mindMap/useMindMap.ts";
import LayerView from "@/mindMap/layer/LayerView.vue";
import {computed, onBeforeUnmount, onMounted, ref, useTemplateRef} from "vue";
import {useTouchEnterLeave} from "@/event/TouchEnterLeave.ts";

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

    isTouchDevice,
} = useMindMap()

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

const container = useTemplateRef<HTMLDivElement>("container")

const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Delete") {
        e.preventDefault()
        removeLayer(currentLayer.value.id)
    } else if (e.key === "ArrowUp") {
        const currentIndex = layers.findIndex(it => it.id === currentLayer.value.id)
        if (layers.length > 1 && currentIndex !== -1 && currentIndex !== layers.length - 1) {
            e.preventDefault()
            swapLayer(currentIndex, currentIndex + 1)
        }
    } else if (e.key === "ArrowDown") {
        const currentIndex = layers.findIndex(it => it.id === currentLayer.value.id)
        if (layers.length > 1 && currentIndex !== -1 && currentIndex !== 0 && scrollWrapper.value) {
            e.preventDefault()
            swapLayer(currentIndex, currentIndex - 1)
        }
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

const handleLeaveContainer = () => {
    if (isDragging.value) {
        overTarget.value = undefined
    }
}

const reverseIndex = (reversedIndex: number): number => {
    return layers.length - 1 - reversedIndex
}

const handleDragStart = (index: number, layer: MindMapLayer, clientXY: {
    x: number,
    y: number
}, target: HTMLElement) => {
    draggingLayer.value = {index, layer}
    isDragging.value = true

    dragStartElementXY = {
        x: target.offsetLeft - (scrollWrapper.value?.scrollLeft ?? 0),
        y: target.offsetTop - (scrollWrapper.value?.scrollTop ?? 0),
    }
    dragStartClientXY = {
        x: clientXY.x,
        y: clientXY.y,
    }
    dragMoveClientXY.value = {
        x: dragStartElementXY.x,
        y: dragStartElementXY.y,
    }
}

const handleDragMove = (clientXY: { x: number, y: number }) => {
    if (isDragging.value && scrollWrapper.value && dragStartClientXY !== undefined && dragStartElementXY !== undefined) {
        dragMoveClientXY.value = {
            x: dragStartElementXY.x + clientXY.x - dragStartClientXY.x,
            y: dragStartElementXY.y + clientXY.y - dragStartClientXY.y,
        }
    }
}

const handleDragEnd = () => {
    if (isDragging.value) {
        isDragging.value = false

        if (draggingLayer.value && overTarget.value && draggingLayer.value.layer.id !== overTarget.value.layer.id) {
            const draggingIndex = draggingLayer.value.index
            const targetIndex = overTarget.value.index
            const type = overTarget.value.type
            if (type === 'layer') {
                swapLayer(reverseIndex(draggingIndex), reverseIndex(targetIndex))
            } else if (type === 'gap') {
                dragLayer(reverseIndex(draggingIndex), reverseIndex(targetIndex))
            }
        }
    }

    resetDragState()
}

const mouseDragStartFlag = new Set<number>()
const handleDragStartByMouse = (index: number, layer: MindMapLayer, event: MouseEvent) => {
    if (!(event.target instanceof HTMLElement)) return
    const target = event.target

    mouseDragStartFlag.add(index)
    const deleteFlag = () => {
        mouseDragStartFlag.delete(index)
    }
    setTimeout(() => {
        if (!mouseDragStartFlag.has(index)) {
            document.documentElement.removeEventListener("mousemove", deleteFlag)
            document.documentElement.removeEventListener("mouseup", deleteFlag)
            return
        }
        handleDragStart(index, layer, {x: event.clientX, y: event.clientY}, target)

        document.documentElement.addEventListener("mousemove", handleDraggingByMouse)
        document.documentElement.addEventListener("mouseup", handleDragEndByMouse)
    }, 100)

    document.documentElement.addEventListener("mousemove", deleteFlag, {once: true})
    document.documentElement.addEventListener("mouseup", deleteFlag, {once: true})
}

const handleDraggingByMouse = (event: MouseEvent) => {
    handleDragMove({x: event.clientX, y: event.clientY})
}

const handleDragEndByMouse = () => {
    document.documentElement.removeEventListener("mousemove", handleDraggingByMouse)
    document.documentElement.removeEventListener("mouseup", handleDragEndByMouse)

    handleDragEnd()
}


const {handleTouchMove} = useTouchEnterLeave()

const handleTouchMoveToEmitTouchEnter = (e: TouchEvent) => {
    if (container.value) {
        const clientXY = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }

        const handles = container.value.querySelectorAll('.layer-menu-item-scroll-handle')
        const items = container.value.querySelectorAll('.layer-menu-item')
        const gaps = container.value.querySelectorAll('.layer-menu-item-gap')

        handleTouchMove([...handles, ...items, ...gaps], clientXY)
    }
}

onMounted(() => {
    if (isTouchDevice.value && container.value) {
        container.value.addEventListener('touchmove', handleTouchMoveToEmitTouchEnter)
    }
})
onBeforeUnmount(() => {
    container.value?.removeEventListener('touchmove', handleTouchMoveToEmitTouchEnter)
})

const touchDragStartFlag = new Set<number>()
const handleDragStartByTouch = (index: number, layer: MindMapLayer, event: TouchEvent) => {
    if (!(event.target instanceof HTMLElement)) return
    const target = event.target

    touchDragStartFlag.add(index)
    const deleteFlag = () => {
        touchDragStartFlag.delete(index)
    }
    setTimeout(() => {
        if (!touchDragStartFlag.has(index)) {
            document.documentElement.removeEventListener("touchmove", deleteFlag)
            document.documentElement.removeEventListener("touchend", deleteFlag)
            document.documentElement.removeEventListener("touchcancel", deleteFlag)
            return
        }
        handleDragStart(index, layer, {x: event.touches[0].clientX, y: event.touches[0].clientY}, target)

        document.documentElement.addEventListener("touchmove", handleDraggingByTouch, {passive: false})
        document.documentElement.addEventListener("touchend", handleDragEndByMouseByTouch)
        document.documentElement.addEventListener("touchcancel", handleDragEndByMouseByTouch)
    }, 100)

    document.documentElement.addEventListener("touchmove", deleteFlag, {once: true})
    document.documentElement.addEventListener("touchend", deleteFlag, {once: true})
    document.documentElement.addEventListener("touchcancel", deleteFlag, {once: true})
}

const handleDraggingByTouch = (event: TouchEvent) => {
    event.preventDefault()
    handleDragMove({x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY})
}

const handleDragEndByMouseByTouch = () => {
    document.documentElement.removeEventListener("touchmove", handleDraggingByTouch)
    document.documentElement.removeEventListener("touchend", handleDragEndByMouseByTouch)
    document.documentElement.removeEventListener("touchcancel", handleDragEndByMouseByTouch)

    handleDragEnd()
}

const handleLayerDragEnter = (index: number, layer: MindMapLayer) => {
    if (!isDragging.value) return
    if (overTarget.value?.layer.id !== layer.id) {
        overTarget.value = {index, layer, type: 'layer'}
    }
}

const handleGapDragEnter = (index: number, layer: MindMapLayer) => {
    if (!isDragging.value) return
    if (overTarget.value?.layer.id !== layer.id) {
        overTarget.value = {index, layer, type: 'gap'}
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
    <div class="layer-menu" tabindex="-1" @keydown="handleKeyDown">
        <div class="layer-menu-header">
            <button @click="addLayer">add</button>
        </div>

        <div
            class="layer-menu-container"
            ref="container"
            @mouseleave="handleLeaveContainer"
            @touchleave="handleLeaveContainer"
        >
            <div
                v-if="isDragging && draggingLayer && dragMoveClientXY"
                class="layer-menu-item-dragged-view"
                :style="{
                    top: dragMoveClientXY.y + 'px',
                    left: dragMoveClientXY.x + 'px',
                }">
                <div class="layer-menu-item-view">
                    <LayerView :layer="draggingLayer.layer"/>
                </div>
                <input
                    class="layer-menu-item-name"
                    :value="draggingLayer.layer.name"
                    style="user-focus: none; user-select: none; user-input: none;"
                />
            </div>

            <div
                class="layer-menu-item-scroll-wrapper"
                ref="scrollWrapper"
                @scroll="handleScroll"
            >
                <div
                    class="layer-menu-item-gap"
                    :class="{
                        over: overTarget?.index === -1 && overTarget?.type === 'gap'
                    }"
                    @mouseenter="handleGapDragEnter(-1, lastLayer)"
                    @touchenter="handleGapDragEnter(-1, lastLayer)"
                />

                <TransitionGroup name="layers" tag="div">
                    <template v-for="(layer, index) in layers.slice().reverse()" :key="layer.id">
                        <div
                            class="layer-menu-item"
                            :class="{
                            current: currentLayer.id === layer.id,
                            dragged: draggingLayer?.index === index,
                            over: overTarget?.index === index && overTarget?.type === 'layer'
                        }"
                            @click="toggleLayer(layer.id)"

                            @mousedown.self="handleDragStartByMouse(index, layer, $event)"
                            @mouseenter="handleLayerDragEnter(index, layer)"

                            @touchstart.self="handleDragStartByTouch(index, layer, $event)"
                            @touchenter="handleLayerDragEnter(index, layer)"
                        >
                            <button
                                @click.stop="toggleLayerVisible(layer)"
                                class="layer-menu-item-visible"
                            >
                                {{ layer.visible ? 'show' : 'hide' }}
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
                                del
                            </button>
                        </div>

                        <div
                            class="layer-menu-item-gap"
                            :class="{
                            over: overTarget?.index === index && overTarget?.type === 'gap'
                        }"
                            @mouseenter="handleGapDragEnter(index, layer)"
                            @touchenter="handleGapDragEnter(index, layer)"
                        />
                    </template>
                </TransitionGroup>
            </div>

            <div
                v-if="canDragUp"
                class="layer-menu-item-scroll-handle up"
                style="position: absolute; top: 0; left: 0; right: 0;"

                @mouseenter="startDragUp"
                @mouseleave="stopDragUp"
                @mouseup="stopDragUp"

                @touchenter="startDragUp"
                @touchleave="stopDragUp"
                @touchstop="stopDragUp"
                @touchcancel="stopDragUp"
            />

            <div
                v-if="canDragDown"
                class="layer-menu-item-scroll-handle down"
                style="position: absolute; bottom: 0; left: 0; right: 0;"

                @mouseenter="startDragDown"
                @mouseleave="stopDragDown"
                @mouseup="stopDragDown"

                @touchenter="startDragDown"
                @touchleave="stopDragDown"
                @touchstop="stopDragDown"
                @touchcancel="stopDragDown"
            />
        </div>
    </div>
</template>

<style scoped>
.layer-menu {
    height: 100%;
    width: 100%;
    background-color: var(--background-color);
    border: var(--border);
}

.layer-menu-header {
    height: 2rem;
}

.layer-menu-container {
    position: relative;
    height: calc(100% - 2rem);
    overflow: hidden;
}

.layer-menu-item-scroll-wrapper {
    position: relative;
    height: 100%;
    width: 100%;
    padding-bottom: 3rem;
    overflow-x: scroll;
    overflow-y: scroll;
    scrollbar-gutter: stable;
}

.layer-menu-item {
    background-color: var(--background-color);
    height: 5rem;
    width: 100%;
    display: grid;
    grid-template-columns: 1.5rem 4rem calc(100% - 7rem) 1.5rem;
    user-select: none;
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

.layer-menu-item-dragged-view {
    position: absolute;
    height: 5rem;
    width: 100%;
    padding: 0 1.5rem;
    display: grid;
    grid-template-columns: 4rem calc(100% - 7rem);
    opacity: 0.8;
    pointer-events: none;
    z-index: 1000000;
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
    height: 1rem;
    margin-top: 2rem;
}

.layer-menu-item-name {
    font-size: 0.9rem;
    pointer-events: none;
    background-color: transparent;
    border: none;
}

.current .layer-menu-item-name {
    pointer-events: initial;
    cursor: default;
}


.layer-menu-item-name:focus {
    background-color: var(--background-color);
    border: var(--border);
    cursor: text;
}

.layer-menu-item-scroll-handle {
    height: 2rem;
    z-index: 1000000;
}

.layer-menu-item-scroll-handle.up {
    background: linear-gradient(to top, transparent, var(--background-color-hover));
}

.layer-menu-item-scroll-handle.down {
    background: linear-gradient(to bottom, transparent, var(--background-color-hover));
}


.layer-menu-item-gap {
    height: 0.3rem;
    transition: height 0.5s;
    background-color: var(--background-color-hover);
}

.layer-menu-item-gap.over {
    height: 5rem;
    background-color: var(--primary-color);
    opacity: 0.6;
    cursor: default;
}


/* layers 过渡动画 */
.layers-move,
.layers-enter-active,
.layers-leave-active {
    transition: opacity 0.5s ease, transform 0.5s ease;
}

.layers-enter-from,
.layers-leave-to {
    opacity: 0;
    transform: scaleY(0.3);
}

.layers-leave-active {
    position: absolute;
}
</style>
