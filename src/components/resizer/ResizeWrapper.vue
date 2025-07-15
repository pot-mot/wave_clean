<script setup lang="ts">
import {readonly, ref} from 'vue'
import {
    resizeBorderKeys,
    resizeHandleKeys,
    ResizeDirection,
    ResizeEventArgs,
    ResizeOrigin,
    ResizeStartEventArgs, ResizeStopEventArgs
} from "@/components/resizer/ResizeWrapperType.ts";

const size = defineModel<{
    width: number,
    height: number,
}>({
    required: true
})

const props = withDefaults(defineProps<{
    scale?: number,
    disabled?: boolean,
    handleSize?: string,
    borderWidth?: string,
}>(), {
    scale: 1,
    disabled: false,
    handleSize: '8px',
    borderWidth: '2px',
})

const emits = defineEmits<{
    (event: "resize-start", args: ResizeStartEventArgs): void
    (event: "resize", args: ResizeEventArgs): void
    (event: "resize-stop", args: ResizeStopEventArgs): void
}>()


const isResizing = ref(false)

const resizeOrigin = ref<ResizeOrigin>()
const resizeDirection = ref<ResizeDirection>()

const startResize = (direction: ResizeDirection, e: MouseEvent | TouchEvent) => {
    if (isResizing.value) return

    const isTouchEvent = e instanceof TouchEvent
    const mouseOrTouch = isTouchEvent ? e.touches[0] : e
    if (!mouseOrTouch) return

    isResizing.value = true
    resizeDirection.value = direction
    resizeOrigin.value = {
        clientX: mouseOrTouch.clientX,
        clientY: mouseOrTouch.clientY,
        width: size.value.width,
        height: size.value.height,
    }

    if (isTouchEvent) {
        document.addEventListener('touchmove', handleResizingByTouch)
        document.addEventListener('touchend', stopResizeByTouch)
        document.addEventListener('touchcancel', stopResizeByTouch)
    } else {
        document.addEventListener('mousemove', handleResizing)
        document.addEventListener('mouseup', stopResize)
    }

    emits("resize-start", {
        origin: resizeOrigin.value,
        direction: resizeDirection.value
    })
}

const cleanResizeEvent = () => {
    document.removeEventListener('mousemove', handleResizing)
    document.removeEventListener('mouseup', stopResize)
    document.removeEventListener('touchmove', handleResizingByTouch)
    document.removeEventListener('touchend', stopResizeByTouch)
    document.removeEventListener('touchcancel', stopResizeByTouch)
}

const handleResizing = (position: { clientX: number, clientY: number }) => {
    if (!isResizing.value || !resizeOrigin.value || !resizeDirection.value) {
        cleanResizeEvent()
        return
    }

    // 和初始对比的偏移量
    const dx = (position.clientX - resizeOrigin.value.clientX) / props.scale
    const dy = (position.clientY - resizeOrigin.value.clientY) / props.scale

    const previousHeight = size.value.height
    const previousWidth = size.value.width

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

    const currentSizeDiff = {
        x: size.value.width - previousWidth,
        y: size.value.height - previousHeight,
    }

    const totalPositionDiff = {x: 0, y: 0}
    const currentPositionDiff = {x: 0, y: 0}

    switch (resizeDirection.value) {
        case "top":
        case "top-left":
        case "top-right":
            totalPositionDiff.y = dy
            currentPositionDiff.y = -currentSizeDiff.y
            break
    }

    switch (resizeDirection.value) {
        case "left":
        case "top-left":
        case "bottom-left":
            totalPositionDiff.x = dx
            currentPositionDiff.x = -currentSizeDiff.x
            break
    }

    emits('resize', {
        origin: resizeOrigin.value,
        direction: resizeDirection.value,
        currentSize: {
            width: size.value.width,
            height: size.value.height,
        },
        totalSizeDiff: {
            x: dx,
            y: dy,
        },
        currentSizeDiff,
        totalPositionDiff,
        currentPositionDiff,
    })
}

const handleResizingByTouch = (e: TouchEvent) => {
    handleResizing(e.changedTouches[0] ?? e.touches[0])
}

const stopResize = (position: { clientX: number, clientY: number }) => {
    if (!isResizing.value || !resizeOrigin.value || !resizeDirection.value) {
        cleanResizeEvent()
        return
    }

    isResizing.value = false
    cleanResizeEvent()

    emits("resize-stop", {
        origin: resizeOrigin.value,
        direction: resizeDirection.value,
        currentSize: {
            width: size.value.width,
            height: size.value.height,
        },
        totalSizeDiff: {
            x: (position.clientX - resizeOrigin.value.clientX) / props.scale,
            y: (position.clientY - resizeOrigin.value.clientY) / props.scale,
        }
    })

    resizeDirection.value = undefined
    resizeOrigin.value = undefined
}

const stopResizeByTouch = (e: TouchEvent) => {
    stopResize(e.changedTouches[0] ?? e.touches[0])
}

defineExpose({
    isResizing: readonly(isResizing),
})
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

        <template v-if="!disabled">
            <div
                v-for="key of resizeBorderKeys"
                :class="`resize-border ${key}`"
                @mousedown.capture.stop.prevent="startResize(key, $event)"
                @touchstart.capture.stop="startResize(key, $event)"
            />

            <div
                v-for="key of resizeHandleKeys"
                :class="`resize-handle ${key}`"
                @mousedown.capture.stop.prevent="startResize(key, $event)"
                @touchstart.capture.stop="startResize(key, $event)"
            />
        </template>
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