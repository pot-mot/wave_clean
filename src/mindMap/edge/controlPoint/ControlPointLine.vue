<script setup lang="ts">
import {computed, ref} from 'vue';
import type {XYPosition} from '@vue-flow/core';
import type {RawMindMapLayer} from '@/mindMap/layer/MindMapLayer.ts';

const props = defineProps<{
    startPoint: XYPosition;
    controlPoint: XYPosition;
    layer: RawMindMapLayer;
}>();

const emits = defineEmits<{
    (e: 'control-point-drag-start', controlPoint: XYPosition): void;
    (e: 'control-point-drag', controlPoint: XYPosition): void;
    (e: 'control-point-drag-end', controlPoint: XYPosition): void;
}>();

// 计算从起点到控制点的直线路径
const linePath = computed(() => {
    return `M${props.startPoint.x},${props.startPoint.y} L${props.controlPoint.x},${props.controlPoint.y}`;
});

// 拖拽状态
const isDragging = ref(false);
const dragStartScreenPos = ref<XYPosition | null>(null);
const dragStartPos = ref<XYPosition | null>(null);
const draggingPos = ref<XYPosition | null>(null);

// 处理鼠标按下事件
const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    isDragging.value = true;
    dragStartScreenPos.value = {x: e.clientX, y: e.clientY};
    dragStartPos.value = {...props.controlPoint};

    emits('control-point-drag-start', {...props.controlPoint});

    // 添加全局事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
};

// 处理触摸开始事件
const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.touches[0]) return;

    isDragging.value = true;
    dragStartScreenPos.value = {x: e.touches[0].clientX, y: e.touches[0].clientY};
    dragStartPos.value = {...props.controlPoint};
    draggingPos.value = {...props.controlPoint};

    emits('control-point-drag-start', {...props.controlPoint});

    // 添加全局事件监听
    document.addEventListener('touchmove', handleTouchMove, {passive: false});
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
};

// 处理鼠标移动事件
const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value || !dragStartScreenPos.value || !dragStartPos.value) return;

    updateControlPoint(e.clientX, e.clientY);
};

// 处理触摸移动事件
const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.value || !dragStartScreenPos.value || !dragStartPos.value) return;

    e.preventDefault();
    if (!e.touches[0]) return;

    updateControlPoint(e.touches[0].clientX, e.touches[0].clientY);
};

// 更新控制点位置
const updateControlPoint = (clientX: number, clientY: number) => {
    if (!dragStartScreenPos.value || !dragStartPos.value) return;

    const vueFlow = props.layer.vueFlow;
    const viewport = vueFlow.viewport.value;
    const zoom = viewport.zoom;

    // 计算屏幕坐标的差值
    const deltaX = clientX - dragStartScreenPos.value.x;
    const deltaY = clientY - dragStartScreenPos.value.y;

    // 转换为 flow 坐标的差值（考虑缩放）
    const flowDeltaX = deltaX / zoom;
    const flowDeltaY = deltaY / zoom;

    // 计算新的控制点位置
    draggingPos.value = {
        x: dragStartPos.value.x + flowDeltaX,
        y: dragStartPos.value.y + flowDeltaY,
    };

    emits('control-point-drag', {...draggingPos.value});
};

// 处理鼠标释放事件
const handleMouseUp = () => {
    const dragEndPos = draggingPos.value ? {...draggingPos.value} : null;
    cleanupDrag();
    if (dragEndPos) emits('control-point-drag-end', dragEndPos);
};

// 处理触摸结束事件
const handleTouchEnd = () => {
    const dragEndPos = draggingPos.value ? {...draggingPos.value} : null;
    cleanupDrag();
    if (dragEndPos) emits('control-point-drag-end', dragEndPos);
};

// 清理拖拽状态
const cleanupDrag = () => {
    isDragging.value = false;
    dragStartScreenPos.value = null;
    dragStartPos.value = null;
    draggingPos.value = null;

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);
};
</script>

<template>
    <g class="control-point-line">
        <!-- 起点到控制点的连线 -->
        <path
            :d="linePath"
            class="control-line"
        />

        <!-- 控制点标记 -->
        <circle
            :cx="draggingPos?.x ?? controlPoint.x"
            :cy="draggingPos?.y ?? controlPoint.y"
            class="control-point-circle"
            :class="{dragging: isDragging}"
            @mousedown="handleMouseDown"
            @touchstart="handleTouchStart"
        />
    </g>
</template>

<style scoped>
.control-point-line {
    pointer-events: none;
}

.control-line {
    stroke: var(--primary-color);
    stroke-width: 1;
    stroke-dasharray: 4, 2;
    opacity: 0.6;
    fill: none;
}

.control-point-circle {
    pointer-events: initial;
    fill: var(--primary-color);
    stroke: var(--background-color);
    r: 4px;
    stroke-width: 2;
    opacity: 0.8;
    cursor: move;
    transition: r 0.2s ease;
}

.control-point-circle:hover {
    r: 5px;
    opacity: 1;
}

.control-point-circle.dragging {
    r: 5px;
    opacity: 1;
    cursor: grabbing;
}
</style>
