<script setup lang="ts">
import {Handle, NodeProps} from "@vue-flow/core";
import {
    ContentNode,
    ContentNodeData,
    ContentNodeHandles,
    RawMindMapLayer,
    useMindMap
} from "@/mindMap/useMindMap.ts";
import {computed, ref, useTemplateRef} from "vue";
import FitSizeBlockInput from "@/components/input/FitSizeBlockInput.vue";
import {NodeToolbar} from "@vue-flow/node-toolbar";
import IconDelete from "@/components/icons/IconDelete.vue";
import IconCopy from "@/components/icons/IconCopy.vue";
import IconFocus from "@/components/icons/IconFocus.vue";
import {useDeviceStore} from "@/store/deviceStore.ts";
import {blurActiveElement, getMatchedElementOrParent} from "@/utils/event/judgeEventTarget.ts";
import {useMindMapMetaStore} from "@/mindMap/meta/MindMapMetaStore.ts";
import {NodeResizer} from "@vue-flow/node-resizer";
import MarkdownEditor from "@/components/editor/MarkdownEditor.vue";

const {isTouchDevice} = useDeviceStore()

const {meta} = useMindMapMetaStore()

const {
    updateNodeData,
    disableDrag,
    enableDrag,
    isSelectionPlural,
    canMultiSelect,
    findNode,
    selectNode,
    copy,
    paste,
    fitRect,
    remove
} = useMindMap()

const props = withDefaults(defineProps<NodeProps<ContentNodeData> & {
    layer: RawMindMapLayer,
    minWidth?: number,
    minHeight?: number,
}>(), {
    minWidth: 160,
    minHeight: 48,
})

const _node = computed(() => findNode(props.id, props.layer.vueFlow))

const canResize = computed(() => props.data.type === 'markdown')

const innerValue = computed<string>({
    get() {
        return props.data.content
    },
    set(newVal: string) {
        updateNodeData(props.id, {content: newVal})
    }
})

const inputDisable = ref(true)
const inputRef = useTemplateRef<InstanceType<typeof FitSizeBlockInput>>("inputRef")
const markdownEditorRef = useTemplateRef<InstanceType<typeof MarkdownEditor>>("markdownEditorRef")

const inputWidth = ref(0)
const inputHeight = ref(0)

const handleResize = (size: { width: number, height: number }) => {
    const node = _node.value
    if (node) {
        node.width = size.width
        node.height = size.height
    }
    inputWidth.value = size.width
    inputHeight.value = size.height
}

const handleNodeSelect = () => {
    if (isSelectionPlural.value) return
    if (canMultiSelect.value) return
    selectNode(props.id, props.layer.vueFlow)
}

const handleNodeFocus = () => {
    if (canMultiSelect.value) return
    if (!props.selected) return
    disableDrag(props.layer.vueFlow)
    inputDisable.value = false
    if (props.data.type === 'markdown') {
        markdownEditorRef.value?.editorRef?.focus()
    } else {
        inputRef.value?.el?.focus()
    }
}

const handleBlur = () => {
    inputDisable.value = true
    enableDrag(props.layer.vueFlow)
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
    const node = _node.value
    if (node !== undefined) {
        blurActiveElement()
        copy({nodes: [node] as any as ContentNode[], edges: []}, props.layer)

        // 在复制后的下一次点击中执行粘贴
        if (isTouchDevice.value) {
            // 一段时间后移除粘贴动作
            let timeout = setTimeout(() => {
                document.documentElement.removeEventListener('click', handleNextClick)
                clearTimeout(timeout)
            }, 10000)
            const handleNextClick = (e: MouseEvent) => {
                if (e.target instanceof HTMLElement) {
                    if (getMatchedElementOrParent(e.target, (el) => el.classList.contains("vue-flow__nodes") || el.classList.contains("vue-flow__edges")) !== null) {
                        return
                    } else if (getMatchedElementOrParent(e.target, (el) => el.classList.contains("vue-flow__pane")) !== null) {
                        paste()
                        document.documentElement.removeEventListener('click', handleNextClick)
                        clearTimeout(timeout)
                    }
                }
            }
            document.documentElement.addEventListener('click', handleNextClick)
        }
    }
}

// 聚焦
const executeFocus = () => {
    const node = _node.value
    if (node !== undefined) {
        fitRect({
            x: node.position.x,
            y: node.position.y,
            width: node.dimensions.width,
            height: node.dimensions.height,
        })
    }
}

// 边框颜色
const borderColor = computed(() => {
    if (props.selected) {
        return 'var(--primary-color)'
    } else if (props.data.withBorder === true) {
        return 'var(--border-color)'
    } else if (props.data.withBorder !== undefined) {
        return 'transparent'
    } else {
        return 'var(--border-color)'
    }
})

// 删除
const executeDelete = () => {
    blurActiveElement()
    remove({nodes: [props.id]})
}
</script>

<template>
    <div class="content-node">
        <div
            class="fit-parent"
            @mousedown.capture="handleNodeSelect"
            @touchstart.capture="handleNodeSelect"
        >
            <div
                v-if="(!data.type) || data.type === 'text'"
                class="fit-parent"
                :style="{width: `${inputWidth}px`, height: `${inputHeight}px`}"
                @click.capture="handleNodeFocus"
            >
                <FitSizeBlockInput
                    ref="inputRef"
                    :class="{untouchable: inputDisable}"
                    :style="{borderColor}"
                    v-model="innerValue"
                    @resize="handleResize"
                    @blur="handleBlur"
                />
            </div>

            <div
                v-else-if="data.type === 'markdown'"
                :style="{
                    minWidth: `${minWidth}px`,
                    minHeight: `${minHeight}px`,
                    height: _node ? `${_node.dimensions.height}px` : '100%',
                    width: _node ? `${_node.dimensions.width}px` : '100%',
                }"
                @click.capture="handleNodeFocus"
            >
                <MarkdownEditor
                    ref="markdownEditorRef"
                    class="fit-parent"
                    :class="{untouchable: inputDisable}"
                    v-model="innerValue"
                    :theme="meta.currentTheme"
                    @wheel.stop
                    @blur="handleBlur"
                />
            </div>

            <NodeResizer
                v-if="selected && canResize"
                :min-width="minWidth"
                :min-height="minHeight"
            />

            <Handle
                v-for="handle in ContentNodeHandles"
                :id="handle"
                :position="handle"
                @mousedown="onHandleMouseDown"
            />
        </div>

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
    </div>
</template>

<style scoped>
.content-node {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.content-node .fit-parent {
    width: 100%;
    height: 100%;
}

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
    transition: background-color 0.3s ease;
}

.toolbar > button:hover {
    background-color: var(--background-color-hover);
}
</style>
