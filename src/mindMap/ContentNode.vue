<script setup lang="ts">
import {Handle, NodeProps, Position} from "@vue-flow/core";
import {ContentNodeData, useMindMap} from "@/mindMap/useMindMap.ts";
import {computed, ref} from "vue";
import FitSizeInput from "@/input/FitSizeInput.vue";

const {updateNodeData} = useMindMap()

const props = defineProps<NodeProps & {
    data: ContentNodeData,
}>()

const innerValue = computed<string>({
    get() {
        return props.data.content
    },
    set(newVal: string) {
        updateNodeData(props.id, {content: newVal})
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
    <div style="border: 1px solid #ccc">
        <Handle id="source" type="source" :position="Position.Left"/>
        <div :style="{width: `${inputWidth}px`, height: `${inputHeight}px`}">
            <FitSizeInput v-model="innerValue" @resize="handleResize"/>
        </div>
        <Handle id="target" type="target" :position="Position.Right"/>
    </div>
</template>
