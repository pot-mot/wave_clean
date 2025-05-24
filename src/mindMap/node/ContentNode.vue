<script setup lang="ts">
import {Handle, NodeProps} from "@vue-flow/core";
import {ContentNode, ContentNodeData, ContentNodeHandles, useMindMap} from "@/mindMap/useMindMap.ts";
import {computed, ref, useTemplateRef} from "vue";
import FitSizeBlockInput from "@/input/FitSizeBlockInput.vue";
import {NodeToolbar} from "@vue-flow/node-toolbar";
import IconDelete from "@/icons/IconDelete.vue";
import IconCopy from "@/icons/IconCopy.vue";

const {updateNodeData, disableDrag, enableDrag, isSelectionPlural, canMultiSelect, findNode, selectNode,  copy, remove} = useMindMap()

const props = defineProps<NodeProps & {
    data: ContentNodeData,
}>()

const handleCopy = () => {
    const node = findNode(props.id)
    if (node !== undefined) {
        copy({nodes: [node] as any as ContentNode[], edges: []})
    }
}

const handleDelete = () => {
    remove({nodes: [props.id]})
}

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
    const node = findNode(props.id)
    if (node) {
        node.width = size.width
        node.height = size.height
    }
    inputWidth.value = size.width
    inputHeight.value = size.height
}

const inputDisable = ref(true)
const inputRef = useTemplateRef<InstanceType<typeof FitSizeBlockInput>>("inputRef")

const handleNodeMouseDown = () => {
    if (isSelectionPlural.value) return
    if (canMultiSelect.value) return
    selectNode(props.id)
}

const handleNodeWrapperClick = () => {
    if (canMultiSelect.value) return
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
    <div>
        <NodeToolbar :node-id="id" :is-visible="selected && !inputDisable">
            <button @mousedown.capture="handleCopy" style="padding: 0.3rem;">
                <IconCopy/>
            </button>

            <button @mousedown.capture="handleDelete" style="padding: 0.3rem;">
                <IconDelete/>
            </button>
        </NodeToolbar>

        <div
            class="content-node"
            @mousedown.capture="handleNodeMouseDown"
            @touchstart.capture="handleNodeMouseDown"
        >
            <div
                class="node-wrapper"
                :style="{width: `${inputWidth}px`, height: `${inputHeight}px`}"
                @click.capture="handleNodeWrapperClick"
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

            <template v-for="handle in ContentNodeHandles">
                <Handle
                    :id="handle"
                    :position="handle"
                    @mousedown="onHandleMouseDown"
                />
            </template>
        </div>
    </div>
</template>

<style scoped>
.untouchable {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    pointer-events: none;
}

:deep(.vue-flow__handle) {
    width: 0.4rem;
    height: 0.4rem;
    background: var(--border-color);
    border-color: var(--background-color);
    border-radius: 100%;
}

:deep(.vue-flow__handle.mousedown) {
    background: var(--primary-color);
}

:deep(.vue-flow__handle.connecting) {
    background: var(--primary-color);
}
</style>
