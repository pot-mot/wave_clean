<script setup lang="ts">
import {Handle, NodeProps} from "@vue-flow/core";
import {ContentNode, ContentNodeData, ContentNodeHandles, useMindMap} from "@/mindMap/useMindMap.ts";
import {computed, ref, useTemplateRef} from "vue";
import FitSizeBlockInput from "@/input/FitSizeBlockInput.vue";
import {NodeToolbar} from "@vue-flow/node-toolbar";
import IconDelete from "@/icons/IconDelete.vue";
import IconCopy from "@/icons/IconCopy.vue";
import IconFocus from "@/icons/IconFocus.vue";
import {useDeviceStore} from "@/store/deviceStore.ts";
import {blurActiveElement} from "@/mindMap/clickUtils.ts";

const {isTouchDevice} = useDeviceStore()

const {updateNodeData, disableDrag, enableDrag, isSelectionPlural, canMultiSelect, findNode, selectNode,  copy, paste, fitRect, remove, currentLayer} = useMindMap()

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

// 复制
const executeCopy = () => {
    const node = findNode(props.id)
    if (node !== undefined) {
        blurActiveElement()
        copy({nodes: [node] as any as ContentNode[], edges: []})

        // 在复制后的下一次点击中执行粘贴
        if (isTouchDevice.value) {
            currentLayer.value.vueFlow.vueFlowRef.value?.addEventListener('click', () => {
                paste()
            }, {once: true})
        }
    }
}

// 聚焦
const executeFocus = () => {
    const node = findNode(props.id)
    if (node !== undefined) {
        fitRect({
            x: node.position.x,
            y: node.position.y,
            width: node.dimensions.width,
            height: node.dimensions.height,
        })
    }
}

// 删除
const executeDelete = () => {
    blurActiveElement()
    remove({nodes: [props.id]})
}
</script>

<template>
    <div>
        <NodeToolbar :node-id="id" :is-visible="selected && !inputDisable" class="toolbar">
            <button @mousedown.capture.prevent.stop="executeCopy">
                <IconCopy/>
            </button>

            <button @mousedown.capture.prevent.stop="executeFocus">
                <IconFocus/>
            </button>

            <button @mousedown.capture.prevent.stop="executeDelete">
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
    width: 8px;
    height: 8px;
    background: var(--border-color);
    border-width: 2px;
    border-color: var(--background-color);
    border-radius: 100%;
}

:deep(.vue-flow__handle.mousedown) {
    background: var(--primary-color);
}

:deep(.vue-flow__handle.connecting) {
    background: var(--primary-color);
}

.toolbar > button {
    padding: 0.3rem;
    margin-right: 0.3rem;
    transition: background-color 0.5s ease;
}

.toolbar > button svg {
    /* 阻止点击按钮导致外部无法拖拽问题 */
    pointer-events: none !important;
}

.toolbar > button:hover {
    background-color: var(--background-color-hover);
}
</style>
