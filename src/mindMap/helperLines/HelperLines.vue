<script setup lang="ts">
import {computed, ref, useTemplateRef, watch} from 'vue';
import {useMindMap} from '@/mindMap/useMindMap.ts';
import type {NodeChange, VueFlowStore} from '@vue-flow/core';
import {getHelperLines, type NodeBounds} from '@/mindMap/helperLines/getHelperLines.ts';
import {useThemeStore} from '@/store/themeStore.ts';

const props = withDefaults(
    defineProps<{
        extensionOffset?: number | undefined;
        dashed?: number | undefined;
    }>(),
    {
        extensionOffset: 16,
        dashed: 2,
    },
);

const mindMap = useMindMap();
const vueFlow = computed(() => mindMap.currentLayer.value.vueFlow);

const themeStore = useThemeStore();

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef');

const horizontal = ref<{
    startX: number;
    endX: number;
    y: number;
}>();
const vertical = ref<{
    x: number;
    startY: number;
    endY: number;
}>();

const width = computed(() => vueFlow.value.dimensions.value.width);
const height = computed(() => vueFlow.value.dimensions.value.height);

const x = computed(() => vueFlow.value.viewport.value.x);
const y = computed(() => vueFlow.value.viewport.value.y);
const zoom = computed(() => vueFlow.value.viewport.value.zoom);

const xGraphToCanvas = (value: number): number => value * zoom.value + x.value;
const yGraphToCanvas = (value: number): number => value * zoom.value + y.value;

// 视口边界（考虑 zoom 和平移）
const viewportRect = computed(() => {
    return {
        left: -x.value / zoom.value,
        right: (-x.value + width.value) / zoom.value,
        top: -y.value / zoom.value,
        bottom: (-y.value + height.value) / zoom.value,
    };
});

const produceNodeChange = (changes: NodeChange[]) => {
    horizontal.value = undefined;
    vertical.value = undefined;

    if (changes.length > 1) return;
    const change = changes[0];
    if (!change) return;
    if (!('id' in change)) return;
    if (!('position' in change) && !('dimensions' in change)) return;

    const nodeA = vueFlow.value.nodes.value.find((node) => node.id === change.id);
    if (!nodeA) return;

    const nodeABounds: NodeBounds = {
        id: nodeA.id,
        left: nodeA.position.x,
        right: nodeA.position.x + nodeA.dimensions.width,
        top: nodeA.position.y,
        bottom: nodeA.position.y + nodeA.dimensions.height,
        width: nodeA.dimensions.width,
        height: nodeA.dimensions.height,
    };

    if ('position' in change && change.position !== undefined) {
        nodeABounds.left = change.position.x;
        nodeABounds.right = change.position.x + nodeABounds.width;
        nodeABounds.top = change.position.y;
        nodeABounds.bottom = change.position.y + nodeABounds.height;
    }
    if ('dimensions' in change && change.dimensions !== undefined) {
        nodeABounds.right = nodeABounds.left + change.dimensions.width;
        nodeABounds.bottom = nodeABounds.top + change.dimensions.height;
        nodeABounds.width = change.dimensions.width;
        nodeABounds.height = change.dimensions.height;
    }

    const {
        left: viewportLeft,
        right: viewportRight,
        top: viewportTop,
        bottom: viewportBottom,
    } = viewportRect.value;

    const nodeBounds = mindMap.layers
        .flatMap((layer): NodeBounds[] => {
            return layer.vueFlow.nodes.value.map((node) => ({
                id: node.id,
                left: node.position.x,
                right: node.position.x + node.dimensions.width,
                top: node.position.y,
                bottom: node.position.y + node.dimensions.height,
                width: node.dimensions.width,
                height: node.dimensions.height,
            }));
        })
        .filter((node) => {
            if (node.id === nodeA.id) return false;

            // 检查节点是否在可见区域内（有重叠）
            return (
                node.right > viewportLeft &&
                node.left < viewportRight &&
                node.bottom > viewportTop &&
                node.top < viewportBottom
            );
        });
    const helperLines = getHelperLines(nodeABounds, nodeBounds);

    if ('position' in change) {
        if (helperLines.snapPosition.x !== undefined) {
            change.position.x = helperLines.snapPosition.x;
        }
        if (helperLines.snapPosition.y !== undefined) {
            change.position.y = helperLines.snapPosition.y;
        }
    }

    // if helper lines are returned, we set them so that they can be displayed
    if (helperLines.horizontal !== undefined) {
        const {value, target} = helperLines.horizontal;
        horizontal.value = {
            startX: xGraphToCanvas(Math.min(nodeABounds.left, target.left)) - props.extensionOffset,
            endX: xGraphToCanvas(Math.max(nodeABounds.right, target.right)) + props.extensionOffset,
            y: yGraphToCanvas(value),
        };
    }
    if (helperLines.vertical !== undefined) {
        const {value, target} = helperLines.vertical;
        vertical.value = {
            x: xGraphToCanvas(value),
            startY: yGraphToCanvas(Math.min(nodeABounds.top, target.top)) - props.extensionOffset,
            endY:
                yGraphToCanvas(Math.max(nodeABounds.bottom, target.bottom)) + props.extensionOffset,
        };
    }

    vueFlow.value.nodes.value = vueFlow.value.applyNodeChanges([change]);
};

let oldVueFlow: VueFlowStore | null = null;
watch(
    () => vueFlow.value,
    (current) => {
        if (oldVueFlow) {
            oldVueFlow.hooks.value.nodesChange.off(produceNodeChange);
        }
        current.onNodesChange(produceNodeChange);
        oldVueFlow = current;
    },
);

const updateCanvasHelperLines = () => {
    const canvas = canvasRef.value;
    const ctx = canvas?.getContext('2d');

    if (!ctx || !canvas) {
        return;
    }

    const dpi = window.devicePixelRatio;
    canvas.width = width.value * dpi;
    canvas.height = height.value * dpi;

    ctx.scale(dpi, dpi);
    ctx.clearRect(0, 0, width.value, height.value);
    ctx.strokeStyle = themeStore.primaryColor.value;

    if (vertical.value !== undefined) {
        ctx.moveTo(vertical.value.x, vertical.value.startY);
        ctx.lineTo(vertical.value.x, vertical.value.endY);
        ctx.setLineDash([props.dashed, props.dashed]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    if (horizontal.value !== undefined) {
        ctx.moveTo(horizontal.value.startX, horizontal.value.y);
        ctx.lineTo(horizontal.value.endX, horizontal.value.y);
        ctx.setLineDash([props.dashed, props.dashed]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
};

watch(
    () => [
        width.value,
        height.value,
        x.value,
        y.value,
        zoom.value,
        horizontal.value,
        vertical.value,
    ],
    () => updateCanvasHelperLines(),
    {immediate: true},
);
</script>

<template>
    <canvas
        ref="canvasRef"
        class="vue-flow__canvas"
    />
</template>

<style scoped>
.vue-flow__canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    pointer-events: none;
}
</style>
