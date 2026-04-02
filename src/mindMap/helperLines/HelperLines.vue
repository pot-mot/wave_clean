<script setup lang="ts">
import {computed, ref, useTemplateRef, watch} from 'vue';
import {useMindMap} from '@/mindMap/useMindMap.ts';
import type {NodeChange, VueFlowStore} from '@vue-flow/core';
import {getHelperLines} from '@/mindMap/helperLines/getHelperLines.ts';
import {useThemeStore} from '@/store/themeStore.ts';
import {throttle} from 'lodash-es';

const mindMap = useMindMap();
const vueFlow = computed(() => mindMap.currentLayer.value.vueFlow);

const themeStore = useThemeStore();

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef');

const horizontal = ref<number>();
const vertical = ref<number>();

const width = computed(() => vueFlow.value.dimensions.value.width);
const height = computed(() => vueFlow.value.dimensions.value.height);

const x = computed(() => vueFlow.value.viewport.value.x);
const y = computed(() => vueFlow.value.viewport.value.y);
const zoom = computed(() => vueFlow.value.viewport.value.zoom);

const produceNodeChange = throttle((changes: NodeChange[]) => {
    horizontal.value = undefined;
    vertical.value = undefined;

    if (changes.length > 1) return;
    const change = changes[0];
    if (!change) return;
    if (!('position' in change)) return;

    const nodes = mindMap.layers.flatMap((layer) => layer.vueFlow.nodes.value);
    const helperLines = getHelperLines(change, nodes);

    // if we have a helper line, we snap the node to the helper line position
    // this is being done by manipulating the node position inside the change object
    change.position.x = helperLines.snapPosition.x ?? change.position.x;
    change.position.y = helperLines.snapPosition.y ?? change.position.y;

    // if helper lines are returned, we set them so that they can be displayed
    horizontal.value = helperLines.horizontal;
    vertical.value = helperLines.vertical;

    vueFlow.value.nodes.value = vueFlow.value.applyNodeChanges([change]);
}, 32);

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
        ctx.moveTo(vertical.value * zoom.value + x.value, 0);
        ctx.lineTo(vertical.value * zoom.value + x.value, height.value);
        ctx.stroke();
    }

    if (horizontal.value !== undefined) {
        ctx.moveTo(0, horizontal.value * zoom.value + y.value);
        ctx.lineTo(width.value, horizontal.value * zoom.value + y.value);
        ctx.stroke();
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
