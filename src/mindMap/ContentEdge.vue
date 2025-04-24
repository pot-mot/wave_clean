<script setup lang="ts">
import {computed, ref} from "vue";
import {BezierEdge, BezierEdgeProps} from "@vue-flow/core";
import {ContentEdgeData, useMindMap} from "@/mindMap/useMindMap.ts";
import FitSizeInput from "@/input/FitSizeInput.vue";

const {updateEdgeData} = useMindMap()

const props = defineProps<BezierEdgeProps & {
    id: string,
    data: ContentEdgeData,
}>()

const innerValue = computed<string>({
    get() {
        return props.data.content
    },
    set(newVal) {
        updateEdgeData(props.id, {content: newVal})
    }
})

const inputWidth = ref(0)
const inputHeight = ref(0)

const handleResize = (size: { width: number, height: number }) => {
    inputWidth.value = size.width
    inputHeight.value = size.height
}
</script>

<template>
    <g>
        <BezierEdge v-bind.prop="props"/>
        <g :transform="`translate(${(sourceX + targetX - inputWidth) / 2} ${(sourceY + targetY - inputHeight) / 2})`">
            <foreignObject x="0" y="0" :width="inputWidth" :height="inputHeight">
                <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%;">
                    <FitSizeInput v-model="innerValue" @resize="handleResize"/>
                </div>
            </foreignObject>
        </g>
    </g>
</template>
