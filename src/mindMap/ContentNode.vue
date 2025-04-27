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

const handleClick = () => {
    if (!props.selected) return
    disableDrag()
    inputDisable.value = false
    inputRef.value?.el?.focus()
}

const handleBlur = () => {
    inputDisable.value = true
    enableDrag()
}

const onHandleMouseDown = (e: MouseEvent) => {
    if (e.target instanceof HTMLElement) {
        const target = e.target as HTMLElement
        target.classList.add("mousedown")
        document.documentElement.addEventListener("mouseup", () => {
            target.classList.remove("mousedown")
        }, {once: true})
    }
}
</script>

<template>
    <div class="content-node">
        <div
            :style="{width: `${inputWidth}px`, height: `${inputHeight}px`}"
            @click.capture="handleClick"
        >
            <FitSizeBlockInput
                ref="inputRef"
                :class="{untouchable: inputDisable}"
                :style="{borderColor: selected ? 'var(--primary-color)' : 'var(--border-color)'}"
                v-model="innerValue"
                @resize="handleResize"
                @blur="handleBlur"
            />
        </div>

        <Handle :id="`${id}-left`" :position="Position.Left" @mousedown="onHandleMouseDown"/>
        <Handle :id="`${id}-right`" :position="Position.Right" @mousedown="onHandleMouseDown"/>
        <Handle :id="`${id}-top`" :position="Position.Top" @mousedown="onHandleMouseDown"/>
        <Handle :id="`${id}-bottom`" :position="Position.Bottom" @mousedown="onHandleMouseDown"/>
    </div>
</template>

<style scoped>
.untouchable {
    user-select: none;
    pointer-events: none;
}

:deep(.vue-flow__handle) {
    width: 0.4em;
    height: 0.4em;
    background: var(--background-color);
    border-color: var(--border-color);
    border-radius: 100%;
}

:deep(.vue-flow__handle.mousedown) {
    background: var(--background-color);
    border-color: var(--primary-color);
}

:deep(.vue-flow__handle.connecting) {
    background: var(--background-color);
    border-color: var(--primary-color);
}
</style>
