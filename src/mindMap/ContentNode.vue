<script setup lang="ts">
import {Handle, NodeProps, Position} from "@vue-flow/core";
import {ContentNodeData, useMindMap} from "@/mindMap/useMindMap.ts";
import {computed, ref, useTemplateRef} from "vue";
import FitSizeBlockInput from "@/input/FitSizeBlockInput.vue";

const {updateNodeData, disableDrag, enableDrag} = useMindMap()

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

const inputDisable = ref(true)
const inputRef = useTemplateRef<InstanceType<typeof FitSizeBlockInput>>("inputRef")

const handleDoubleClick = () => {
    console.log("double click")
    disableDrag()
    inputDisable.value = false
    inputRef.value?.el?.focus()
}

const handleBlur = () => {
    enableDrag()
    inputDisable.value = true
}
</script>

<template>
    <div class="content-node">
        <Handle id="source" type="source" :position="Position.Left"/>
        <div
            :style="{width: `${inputWidth}px`, height: `${inputHeight}px`}"
            @dblclick.capture="handleDoubleClick"
        >
            <FitSizeBlockInput
                ref="inputRef"
                :class="{untouchable: inputDisable}"
                :style="{borderColor: selected ? 'var(--primary-color)' : undefined}"
                v-model="innerValue"
                @resize="handleResize"
                @blur="handleBlur"
            />
        </div>
        <Handle id="target" type="target" :position="Position.Right"/>
    </div>
</template>

<style scoped>
.untouchable {
    user-select: none;
    pointer-events: none;
}
</style>
