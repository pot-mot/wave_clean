<script setup lang="ts">
import {MindMapLayer} from "@/mindMap/useMindMap.ts";
import {computed, ref, useTemplateRef, watch} from "vue";
import {GraphNode, ViewportTransform} from "@vue-flow/core";
import {debounce} from "lodash";

const props = defineProps<{
    layer: MindMapLayer
}>()

const container = useTemplateRef<HTMLDivElement>("container")

const nodes = computed<GraphNode[]>(() => props.layer.vueFlow.nodes.value)

const viewport = computed<ViewportTransform>(() => props.layer.vueFlow.viewport.value)

type ComputedNode = {
    left: string,
    top: string,
    width: string,
    height: string,
}

const getComputedNodes = (): ComputedNode[] => {
    if (nodes.value.length === 0 || !container.value) return []

    let maxRight = 0
    let maxBottom = 0
    for (const node of nodes.value) {
        const right = node.position.x + node.dimensions.width
        if (right > maxRight) {
            maxRight = right
        }
        const bottom = node.position.y + node.dimensions.height
        if (bottom > maxBottom) {
            maxBottom = bottom
        }
    }
    const width =  maxRight - viewport.value.x
    const height = maxBottom - viewport.value.y

    const scale = width > height ? container.value.clientWidth / width : container.value.clientHeight / height

    return nodes.value.map(node => ({
        left: (node.position.x - viewport.value.x) * scale + 'px',
        top: (node.position.y - viewport.value.y) * scale + 'px',
        width: node.dimensions.width * scale + 'px',
        height: node.dimensions.height * scale + 'px',
    }))
}

/**
 * 将节点
 */
const computedNodes = ref<ComputedNode[]>(getComputedNodes())

watch(() => nodes.value, debounce(() => {
    computedNodes.value = getComputedNodes()
}, 500), {deep: 2})
</script>

<template>
    <div class="layer-view">
        <div
            class="layer-view-container"
            ref="container"
        >
            <div
                v-for="node in computedNodes"
                class="layer-view-node"
                :style="{
                    left: node.left,
                    top: node.top,
                    width: node.width,
                    height: node.height,
                }"
            />
        </div>
    </div>
</template>

<style scoped>
.layer-view {
    width: 100%;
    height: 100%;
    background-color: var(--background-color);
    overflow: hidden;
}

.layer-view-container {
    position: relative;
    height: 100%;
    width: 100%;
}

.layer-view-node {
    border: var(--border);
    position: absolute;
}
</style>
