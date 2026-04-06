<script setup lang="ts">
import {computed, ref, useTemplateRef, watch} from 'vue';
import {useMindMap} from '@/mindMap/useMindMap.ts';
import type {NodeChange, NodePositionChange, VueFlowStore} from '@vue-flow/core';
import {getSnapLines} from '@/mindMap/helperLines/snapLines.ts';
import {useThemeStore} from '@/store/themeStore.ts';
import type {NodeBounds} from '@/mindMap/helperLines/type/NodeBounds.ts';
import type {
    HorizontalHelperLine,
    VerticalHelperLine,
} from '@/mindMap/helperLines/type/HelpLine.ts';
import {
    getHorizontalSpacingAlign,
    getVerticalSpacingAlign,
} from '@/mindMap/helperLines/spacingAlign.ts';

const props = withDefaults(
    defineProps<{
        spinLineWidth?: number | undefined;
        spinLineExtension?: number | undefined;
        spacingAlignLineWidth?: number | undefined;
        spacingAlignExtension?: number | undefined;
        spacingAlignOffset?: number | undefined;
        dashed?: number | undefined;
    }>(),
    {
        spinLineWidth: 1,
        spinLineExtension: 16,
        spacingAlignLineWidth: 2,
        spacingAlignExtension: 8,
        spacingAlignOffset: 4,
        dashed: 2,
    },
);

const mindMap = useMindMap();
const vueFlow = computed(() => mindMap.currentLayer.value.vueFlow);

const themeStore = useThemeStore();

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef');

const hSnapLine = ref<HorizontalHelperLine>();
const vSnapLine = ref<VerticalHelperLine>();

const hSpacingLines = ref<HorizontalHelperLine[]>([]);
const vSpacingLines = ref<VerticalHelperLine[]>([]);

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

const handleNodeSinglePositionChange = (change: NodePositionChange) => {
    const nodeA = vueFlow.value.nodes.value.find((node) => node.id === change.id);
    if (!nodeA) return;

    const nodeABounds: NodeBounds = {
        id: mindMap.currentLayer.value.id + nodeA.id,
        left: change.position.x,
        right: change.position.x + nodeA.dimensions.width,
        top: change.position.y,
        bottom: change.position.y + nodeA.dimensions.height,
        width: nodeA.dimensions.width,
        height: nodeA.dimensions.height,
    };

    const {
        left: viewportLeft,
        right: viewportRight,
        top: viewportTop,
        bottom: viewportBottom,
    } = viewportRect.value;

    const nodeBounds = mindMap.layers
        .flatMap((layer): NodeBounds[] => {
            return layer.vueFlow.nodes.value.map((node) => ({
                id: layer.id + node.id,
                left: node.position.x,
                right: node.position.x + node.dimensions.width,
                top: node.position.y,
                bottom: node.position.y + node.dimensions.height,
                width: node.dimensions.width,
                height: node.dimensions.height,
            }));
        })
        .filter((node) => {
            if (node.id === nodeABounds.id) return false;

            // 检查节点是否在可见区域内（有重叠）
            return (
                node.right > viewportLeft &&
                node.left < viewportRight &&
                node.bottom > viewportTop &&
                node.top < viewportBottom
            );
        });

    const snapLines = getSnapLines(nodeABounds, nodeBounds);

    if (snapLines.snapPosition.x !== undefined) {
        change.position.x = snapLines.snapPosition.x;
    }
    if (snapLines.snapPosition.y !== undefined) {
        change.position.y = snapLines.snapPosition.y;
    }

    // if helper lines are returned, we set them so that they can be displayed
    if (snapLines.horizontal !== undefined) {
        const {value, targets} = snapLines.horizontal;
        const minX = Math.min(nodeABounds.left, ...targets.map((it) => it.left));
        const maxX = Math.max(nodeABounds.right, ...targets.map((it) => it.right));
        hSnapLine.value = {
            startX: xGraphToCanvas(minX) - props.spinLineExtension,
            endX: xGraphToCanvas(maxX) + props.spinLineExtension,
            y: yGraphToCanvas(value),
        };
    }
    if (snapLines.vertical !== undefined) {
        const {value, targets} = snapLines.vertical;
        const minY = Math.min(nodeABounds.top, ...targets.map((it) => it.top));
        const maxY = Math.max(nodeABounds.bottom, ...targets.map((it) => it.bottom));
        vSnapLine.value = {
            x: xGraphToCanvas(value),
            startY: yGraphToCanvas(minY) - props.spinLineExtension,
            endY: yGraphToCanvas(maxY) + props.spinLineExtension,
        };
    }

    // 应用间距对齐的 snap position
    const hSpacingGroup = getHorizontalSpacingAlign(nodeABounds, nodeBounds);
    const vSpacingGroup = getVerticalSpacingAlign(nodeABounds, nodeBounds);

    if (hSpacingGroup?.snapX !== undefined) {
        change.position.x = hSpacingGroup.snapX;
    }
    if (vSpacingGroup?.snapY !== undefined) {
        change.position.y = vSpacingGroup.snapY;
    }

    // 设置间距辅助线
    if (hSpacingGroup?.lines) {
        hSpacingLines.value = hSpacingGroup.lines.map((line) => ({
            startX: xGraphToCanvas(line.startX),
            endX: xGraphToCanvas(line.endX),
            y: yGraphToCanvas(line.y),
        }));
    }
    if (vSpacingGroup?.lines) {
        vSpacingLines.value = vSpacingGroup.lines.map((line) => ({
            x: xGraphToCanvas(line.x),
            startY: yGraphToCanvas(line.startY),
            endY: yGraphToCanvas(line.endY),
        }));
    }

    vueFlow.value.nodes.value = vueFlow.value.applyNodeChanges([change]);
};

const produceNodeChange = (changes: NodeChange[]) => {
    hSnapLine.value = undefined;
    vSnapLine.value = undefined;
    hSpacingLines.value = [];
    vSpacingLines.value = [];

    if (changes.length > 1) return;
    const change = changes[0];
    if (!change) return;

    if (change.type === 'position') {
        handleNodeSinglePositionChange(change);
    }
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

const cleanHelperLines = () => {
    hSnapLine.value = undefined;
    vSnapLine.value = undefined;
    hSpacingLines.value = [];
    vSpacingLines.value = [];

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
};

const drawHelperLines = () => {
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

    // 绘制吸附辅助线
    ctx.beginPath();
    ctx.strokeStyle = themeStore.primaryColor.value;
    ctx.lineWidth = props.spinLineWidth;
    ctx.setLineDash([props.dashed, props.dashed]);
    if (vSnapLine.value !== undefined) {
        ctx.moveTo(vSnapLine.value.x, vSnapLine.value.startY);
        ctx.lineTo(vSnapLine.value.x, vSnapLine.value.endY);
    }
    if (hSnapLine.value !== undefined) {
        ctx.moveTo(hSnapLine.value.startX, hSnapLine.value.y);
        ctx.lineTo(hSnapLine.value.endX, hSnapLine.value.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制间距辅助线
    ctx.beginPath();
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = props.spacingAlignLineWidth;
    for (const line of hSpacingLines.value) {
        const startY = line.y + props.spacingAlignOffset;
        const centerY = startY + props.spacingAlignExtension;
        const endY = centerY + props.spacingAlignExtension;

        const startX = line.startX + props.spacingAlignLineWidth;
        const endX = line.endX - props.spacingAlignLineWidth;

        ctx.moveTo(startX, centerY);
        ctx.lineTo(endX, centerY);

        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, endY);

        ctx.moveTo(endX, startY);
        ctx.lineTo(endX, endY);
    }
    for (const line of vSpacingLines.value) {
        const startX = line.x + props.spacingAlignOffset;
        const centerX = startX + props.spacingAlignExtension;
        const endX = centerX + props.spacingAlignExtension;

        const startY = line.startY + props.spacingAlignLineWidth;
        const endY = line.endY - props.spacingAlignLineWidth;

        ctx.moveTo(centerX, startY);
        ctx.lineTo(centerX, endY);

        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, startY);

        ctx.moveTo(startX, endY);
        ctx.lineTo(endX, endY);
    }
    ctx.stroke();
};

watch(
    () => [width.value, height.value, x.value, y.value, zoom.value],
    () => cleanHelperLines(),
    {immediate: true},
);

watch(
    () => [hSnapLine.value, vSnapLine.value, hSpacingLines.value, vSpacingLines.value],
    () => drawHelperLines(),
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
