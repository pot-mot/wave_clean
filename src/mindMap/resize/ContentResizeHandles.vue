<script setup lang="ts">
import {ref} from 'vue';
import {useVueFlow} from '@vue-flow/core';
import '@vue-flow/node-resizer/dist/style.css';

// 四角控制点
const resizeCornerPositions = ['top left', 'top right', 'bottom left', 'bottom right'] as const;
// 四边控制线
const resizeLinePositions = ['top', 'right', 'bottom', 'left'] as const;

type ResizeControlPosition =
    | (typeof resizeCornerPositions)[number]
    | (typeof resizeLinePositions)[number];

const props = defineProps<{
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
}>();

const emit = defineEmits<{
    (event: 'resize', size: {width: number; height: number}): void;
    (event: 'resize-end', size: {width: number; height: number}): void;
}>();

const {screenToFlowCoordinate} = useVueFlow();

type ResizeState = {
    pointerId: number;
    position: ResizeControlPosition;
    startPoint: {x: number; y: number};
    startSize: {width: number; height: number};
    size: {width: number; height: number};
};

// 拖拽过程中的状态，不需要响应式
let resizeState: ResizeState | undefined;

// 正在拖拽的控制点（用于样式）
const activePosition = ref<ResizeControlPosition>();

const handlePointerDown = (event: PointerEvent, position: ResizeControlPosition) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const element = event.currentTarget;
    if (!(element instanceof HTMLElement)) return;

    try {
        element.setPointerCapture(event.pointerId);
    } catch {
        // 指针已释放（或合成事件）时忽略，不影响后续 pointermove 处理
    }
    activePosition.value = position;

    resizeState = {
        pointerId: event.pointerId,
        position,
        startPoint: screenToFlowCoordinate({x: event.clientX, y: event.clientY}),
        startSize: {width: props.width, height: props.height},
        size: {width: props.width, height: props.height},
    };
};

const handlePointerMove = (event: PointerEvent) => {
    if (!resizeState || resizeState.pointerId !== event.pointerId) return;
    event.preventDefault();

    const point = screenToFlowCoordinate({x: event.clientX, y: event.clientY});
    const deltaX = point.x - resizeState.startPoint.x;
    const deltaY = point.y - resizeState.startPoint.y;
    const {position, startSize} = resizeState;

    // 内容框以中心为锚点，左右/上下两侧同时伸缩，因此位移需要乘 2
    const widthDelta = position.includes('right')
        ? deltaX * 2
        : position.includes('left')
          ? -deltaX * 2
          : 0;
    const heightDelta = position.includes('bottom')
        ? deltaY * 2
        : position.includes('top')
          ? -deltaY * 2
          : 0;

    resizeState.size = {
        width: Math.max(props.minWidth, startSize.width + widthDelta),
        height: Math.max(props.minHeight, startSize.height + heightDelta),
    };

    emit('resize', resizeState.size);
};

const handleResizeEnd = (event: PointerEvent) => {
    if (!resizeState || resizeState.pointerId !== event.pointerId) return;

    const {size, startSize} = resizeState;
    resizeState = undefined;
    activePosition.value = undefined;

    // 没有实际尺寸变化时不产生历史记录
    if (size.width === startSize.width && size.height === startSize.height) return;

    emit('resize-end', size);
};
</script>

<template>
    <div class="content-resize-handles">
        <div
            v-for="position in resizeLinePositions"
            :key="position"
            class="vue-flow__resize-control line"
            :class="[position, {active: activePosition === position}]"
            @pointerdown="handlePointerDown($event, position)"
            @pointermove="handlePointerMove"
            @pointerup="handleResizeEnd"
            @pointercancel="handleResizeEnd"
        />
        <div
            v-for="position in resizeCornerPositions"
            :key="position"
            class="vue-flow__resize-control handle"
            :class="[...position.split(' '), {active: activePosition === position}]"
            @pointerdown="handlePointerDown($event, position)"
            @pointermove="handlePointerMove"
            @pointerup="handleResizeEnd"
            @pointercancel="handleResizeEnd"
        />
    </div>
</template>

<style scoped>
.content-resize-handles {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.content-resize-handles > * {
    pointer-events: auto;
    touch-action: none;
}

.vue-flow__resize-control.handle {
    background-color: var(--primary-color);
    border: none;
    border-radius: 0;
}

.vue-flow__resize-control.line {
    border-color: var(--primary-color);
}

.vue-flow__resize-control.line.active,
.vue-flow__resize-control.handle.active {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    opacity: 0.7;
}
</style>
