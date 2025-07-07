<script setup lang="ts">
import {ref} from 'vue'

const size = defineModel<{
    width: number,
    height: number,
}>({
    required: true
})

withDefaults(defineProps<{
    handleSize?: string,
    borderWidth?: string,
}>(), {
    handleSize: '8px',
    borderWidth: '2px',
})

type ResizeOrigin = {
    clientX: number,
    clientY: number,
    width: number,
    height: number,
}

type ResizeDirection = 'top' | 'left' | 'right' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const isResizing = ref(false)

const resizeOrigin = ref<ResizeOrigin>()
const resizeDirection = ref<ResizeDirection>()

const startResize = (direction: ResizeDirection, e: MouseEvent) => {
    e.preventDefault()

    isResizing.value = true
    resizeDirection.value = direction
    resizeOrigin.value = {
        clientX: e.clientX,
        clientY: e.clientY,
        width: size.value.width,
        height: size.value.height,
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResize)
}

const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value || !resizeOrigin.value) return

    const dx = e.clientX - resizeOrigin.value.clientX
    const dy = e.clientY - resizeOrigin.value.clientY

    switch (resizeDirection.value) {
        case 'top':
            size.value.height = resizeOrigin.value.height - dy
            break
        case 'left':
            size.value.width = resizeOrigin.value.width - dx
            break
        case 'right':
            size.value.width = resizeOrigin.value.width + dx
            break
        case 'bottom':
            size.value.height = resizeOrigin.value.height + dy
            break

        case 'top-left':
            size.value.width = resizeOrigin.value.width - dx
            size.value.height = resizeOrigin.value.height - dy
            break
        case 'top-right':
            size.value.width = resizeOrigin.value.width + dx
            size.value.height = resizeOrigin.value.height - dy
            break
        case 'bottom-left':
            size.value.width = resizeOrigin.value.width - dx
            size.value.height = resizeOrigin.value.height + dy
            break
        case 'bottom-right':
            size.value.width = resizeOrigin.value.width + dx
            size.value.height = resizeOrigin.value.height + dy
            break
    }
}

const stopResize = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResize)
}
</script>

<template>
    <div
        class="resize-wrapper"
        :style="{
          width: `${size.width}px`,
          height: `${size.height}px`,
        }"
    >
        <slot/>

        <div class="resize-border top" @mousedown.capture.stop.prevent="startResize('top', $event)"/>
        <div class="resize-border left" @mousedown.capture.stop.prevent="startResize('left', $event)"/>
        <div class="resize-border right" @mousedown.capture.stop.prevent="startResize('right', $event)"/>
        <div class="resize-border bottom" @mousedown.capture.stop.prevent="startResize('bottom', $event)"/>

        <div class="resize-handle top-left" @mousedown.capture.stop.prevent="startResize('top-left', $event)"/>
        <div class="resize-handle top-right" @mousedown.capture.stop.prevent="startResize('top-right', $event)"/>
        <div class="resize-handle bottom-left" @mousedown.capture.stop.prevent="startResize('bottom-left', $event)"/>
        <div class="resize-handle bottom-right" @mousedown.capture.stop.prevent="startResize('bottom-right', $event)"/>
    </div>
</template>

<style scoped>
.resize-wrapper {
    position: relative;
    --resize-handle-size: v-bind(handleSize);
    --resize-border-width: v-bind(borderWidth);
}

.resize-border {
    position: absolute;
    width: var(--resize-border-width);
    height: var(--resize-border-width);
    background-color: var(--primary-color);
}

.resize-border.top {
    width: calc(100% - var(--resize-handle-size));

    top: calc(var(--resize-border-width) * -1 / 2);
    left: 50%;
    transform: translateX(-50%);
    cursor: n-resize;
}

.resize-border.left {
    height: calc(100% - var(--resize-handle-size));

    top: 50%;
    left: calc(var(--resize-border-width) * -1 / 2);
    transform: translateY(-50%);
    cursor: w-resize;
}

.resize-border.right {
    height: calc(100% - var(--resize-handle-size));

    top: 50%;
    right: calc(var(--resize-border-width) * -1 / 2);
    transform: translateY(-50%);
    cursor: e-resize;
}

.resize-border.bottom {
    width: calc(100% - var(--resize-handle-size));

    bottom: calc(var(--resize-border-width) * -1 / 2);
    left: 50%;
    transform: translateX(-50%);
    cursor: s-resize;
}

.resize-handle {
    position: absolute;
    width: calc(var(--resize-handle-size));
    height: calc(var(--resize-handle-size));
    background-color: var(--primary-color);
}

.resize-handle.top-left {
    top: calc(var(--resize-handle-size) * -1 / 2);
    left: calc(var(--resize-handle-size) * -1 / 2);
    cursor: nw-resize;
}

.resize-handle.top-right {
    top: calc(var(--resize-handle-size) * -1 / 2);
    right: calc(var(--resize-handle-size) * -1 / 2);
    cursor: ne-resize;
}

.resize-handle.bottom-left {
    bottom: calc(var(--resize-handle-size) * -1 / 2);
    left: calc(var(--resize-handle-size) * -1 / 2);
    cursor: sw-resize;
}

.resize-handle.bottom-right {
    bottom: calc(var(--resize-handle-size) * -1 / 2);
    right: calc(var(--resize-handle-size) * -1 / 2);
    cursor: se-resize;
}
</style>