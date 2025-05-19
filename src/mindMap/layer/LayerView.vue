<script setup lang="ts">
import {MindMapLayer} from "@/mindMap/useMindMap.ts";
import {computed, ref, useTemplateRef, watch} from "vue";
import {GraphNode} from "@vue-flow/core";
import {debounce} from "lodash";

const props = defineProps<{
    layer: MindMapLayer
}>()

const container = useTemplateRef<HTMLDivElement>("container")

const nodes = computed<GraphNode[]>(() => props.layer.vueFlow.nodes.value)

type ComputedNode = {
    left: string,
    top: string,
    width: string,
    height: string,
}

const getComputedNodes = (): ComputedNode[] => {
    if (nodes.value.length === 0 || !container.value) return []

    let minLeft = Number.MAX_VALUE
    let minTop = Number.MAX_VALUE
    let maxRight = Number.MIN_VALUE
    let maxBottom = Number.MIN_VALUE
    for (const node of nodes.value) {
        const left = node.position.x
        if (left < minLeft) {
            minLeft = left
        }
        const top = node.position.y
        if (top < minTop) {
            minTop = top
        }
        const right = node.position.x + node.dimensions.width
        if (right > maxRight) {
            maxRight = right
        }
        const bottom = node.position.y + node.dimensions.height
        if (bottom > maxBottom) {
            maxBottom = bottom
        }
    }
    const width =  maxRight - minLeft
    const height = maxBottom - minTop

    const scale = width > height ? container.value.clientWidth / width : container.value.clientHeight / height

    return nodes.value.map(node => ({
        left: (node.position.x - minLeft) * scale + 'px',
        top: (node.position.y - minTop) * scale + 'px',
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
