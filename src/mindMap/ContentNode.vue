<script setup lang="ts">
import {Handle, NodeProps, Position} from "@vue-flow/core";
import {ContentNodeData, useMindMap} from "@/mindMap/useMindMap.ts";
import {computed, nextTick, ref} from "vue";
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

// 当触发 click 时，组件等待父元素的 click 事件以确定不是拖曳事件，如果不是 drag，则触发 edit 并 disableDrag
const notDragFlag = ref(false)

const onClick = () => {
    notDragFlag.value = true
}

const handleInputClick = () => {
    nextTick(() => {
        if (notDragFlag.value) {
            disableDrag()
        }
    })
}

const handleBlur = () => {
    enableDrag()
    notDragFlag.value = false
}
</script>

<template>
    <div
        class="content-node"
        @click.capture="onClick"
    >
        <Handle id="source" type="source" :position="Position.Left"/>
        <div :style="{width: `${inputWidth}px`, height: `${inputHeight}px`}">
            <FitSizeBlockInput
                :style="{borderColor: selected ? 'var(--primary-color)' : undefined}"
                :class="{untouchable: !notDragFlag}"
                v-model="innerValue"
                @resize="handleResize"
                @click="handleInputClick"
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
