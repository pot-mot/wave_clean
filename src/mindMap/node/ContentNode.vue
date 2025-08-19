<script setup lang="ts">
import {Handle, NodeProps} from "@vue-flow/core";
import {
    MIND_MAP_CONTAINER_ID,
    useMindMap
} from "@/mindMap/useMindMap.ts";
import {computed, nextTick, onMounted, ref, useTemplateRef, watch} from "vue";
import FitSizeBlockInput from "@/components/input/FitSizeBlockInput.vue";
import {NodeToolbar} from "@vue-flow/node-toolbar";
import IconDelete from "@/components/icons/IconDelete.vue";
import IconCopy from "@/components/icons/IconCopy.vue";
import IconFocus from "@/components/icons/IconFocus.vue";
import {useDeviceStore} from "@/store/deviceStore.ts";
import {blurActiveElement, getMatchedElementOrParent} from "@/utils/event/judgeEventTarget.ts";
import {useMindMapMetaStore} from "@/mindMap/meta/MindMapMetaStore.ts";
import MarkdownPreview from "@/components/markdown/preview/MarkdownPreview.vue";
import ResizeWrapper from "@/components/resizer/ResizeWrapper.vue";
import {ResizeEventArgs} from "@/components/resizer/ResizeWrapperType.ts";
import IconEdit from "@/components/icons/IconEdit.vue";
import IconCheck from "@/components/icons/IconCheck.vue";
import IconMarkdown from "@/components/icons/IconMarkdown.vue";
import IconMarkdownOff from "@/components/icons/IconMarkdownOff.vue";
import {RawMindMapLayer} from "@/mindMap/layer/MindMapLayer.ts";
import {
    ContentNode,
    ContentNode_Markdown_initHeight,
    ContentNode_Markdown_initWidth,
    ContentNode_Markdown_minHeight,
    ContentNode_Markdown_minWidth,
    ContentNodeData,
    ContentNodeHandles,
    ContentType,
    ContentType_DEFAULT
} from "@/mindMap/node/ContentNode.ts";
import MarkdownCompositeEditor from "@/components/markdown/compositeEditor/MarkdownCompositeEditor.vue";
import IconFullScreen from "@/components/icons/IconFullScreen.vue";

const {isTouchDevice} = useDeviceStore()

const {meta} = useMindMapMetaStore()

const {
    updateNodeData,
    isSelectionPlural,
    canMultiSelect,
    isConnecting,
    findNode,
    selectNode,
    recordNodeResize,
    copy,
    paste,
    fitRect,
    remove,
    zoom,
    executeAsyncBatch,
} = useMindMap()

const props = defineProps<NodeProps<ContentNodeData> & {
    layer: RawMindMapLayer,
}>()

const _node = computed(() => findNode(props.id, props.layer.vueFlow))

const dataTypeOrDefault = computed<ContentType>(() => props.data.type ?? ContentType_DEFAULT)

// 是否已聚焦
const isFocus = ref(false)

watch(() => props.selected, (value, oldValue) => {
    if (!value && oldValue) {
        isFocus.value = false
        isMarkdownEdit.value = false
    }
})

// text input 模式
const inputRef = useTemplateRef<InstanceType<typeof FitSizeBlockInput>>("inputRef")

const inputValue = computed<string>({
    get() {
        return props.data.content
    },
    set(newVal: string) {
        if (newVal !== props.data.content) {
            updateNodeData(props.id, {content: newVal})
        }
    }
})

type NodeSize = {
    width: number,
    height: number
}

const inputSize = ref<NodeSize>()

const inputWrapperStyle = computed(() => {
    return {
        width: (inputSize.value?.width ?? 0) + "px",
        height: (inputSize.value?.height ?? 0) + "px",
    }
})

const handleInputResize = (size: NodeSize) => {
    const node = _node.value
    if (node) {
        if (inputSize.value !== undefined) {
            // 保持 node 居中
            node.position.x = node.position.x - (size.width - inputSize.value.width) / 2
        }
        node.width = size.width
        node.height = size.height
        node.dimensions.width = size.width
        node.dimensions.height = size.height
    }
    inputSize.value = size
}

const handleInputBlur = () => {
    isFocus.value = false
}

// markdown 模式
const markdownEditorRef = useTemplateRef<InstanceType<typeof MarkdownCompositeEditor>>("markdownEditorRef")
const markdownPreviewRef = useTemplateRef<InstanceType<typeof MarkdownPreview>>("markdownPreviewRef")

const markdownEditorValue = ref<string>(props.data.content)

const isMarkdownEdit = ref(false)

const isMarkdownEditorFullScreen = computed<boolean>(() => markdownEditorRef.value?.isFullScreen ?? false)
const isMarkdownEditorPreviewOverflow = computed<boolean>(() => markdownEditorRef.value?.markdownPreviewRef?.isOverflow ?? false)
const isMarkdownPreviewOverflow = computed<boolean>(() => markdownPreviewRef.value?.isOverflow ?? false)

const markdownEditorTheme = computed(() => {
    return meta.value.currentTheme === "dark" ? "vs-dark" : "vs"
})

watch(() => props.data.content, (value) => {
    if (value !== markdownEditorValue.value) {
        markdownEditorValue.value = value
    }
}, {immediate: true})

const handleMarkdownEditorBlur = () => {
    if (markdownEditorValue.value !== props.data.content) {
        updateNodeData(props.id, {content: markdownEditorValue.value})
    }
}

watch(() => isMarkdownEdit.value, (isEdit) => {
    // 当退出编辑模式时，如果内容有修改，则更新数据
    if (!isEdit && markdownEditorValue.value !== props.data.content) {
        updateNodeData(props.id, {content: markdownEditorValue.value})
    }
})

// 切换编辑模式
const executeToggleMarkdownEdit = async () => {
    isMarkdownEdit.value = !isMarkdownEdit.value
    if (isMarkdownEdit.value) {
        await nextTick()
        markdownEditorRef.value?.editorRef?.focus()
    }
}

// 切换编辑全屏
const executeToggleMarkdownFullScreen = () => {
    markdownEditorRef.value?.toggleFullScreen()
}

// 阻止编辑时切换选中
const stopCtrlClickWhenMarkdownEdit = (e: MouseEvent) => {
    if (isMarkdownEdit.value && e.ctrlKey) {
        e.stopPropagation()
    }
}

// markdown 编辑器尺寸
const MarkdownEditorResizeRef = useTemplateRef<InstanceType<typeof ResizeWrapper>>("MarkdownEditorResizeRef")

const isResizing = computed(() => MarkdownEditorResizeRef.value?.isResizing ?? false)

const markdownContentSize = ref<NodeSize>({
    width: ContentNode_Markdown_initWidth,
    height: ContentNode_Markdown_initHeight,
})

onMounted(async () => {
    const node = _node.value
    if (!node) return
    await nextTick()
    if (node.dimensions.height !== 0 && node.dimensions.width !== 0) {
        markdownContentSize.value = {
            width: node.dimensions.width,
            height: node.dimensions.height,
        }
    }
})

watch(() => _node.value?.dimensions.width, (width) => {
    if (dataTypeOrDefault.value === 'markdown' && width !== undefined && markdownContentSize.value.width !== width) {
        markdownContentSize.value.width = width
    }
})
watch(() => _node.value?.dimensions.height, (height) => {
    if (dataTypeOrDefault.value === 'markdown' && height !== undefined && markdownContentSize.value.height !== height) {
        markdownContentSize.value.height = height
    }
})
watch(() => markdownContentSize.value, (size) => {
    const node = _node.value
    if (!node) return
    node.height = size.height
    node.width = size.width
    node.dimensions.height = size.height
    node.dimensions.width = size.width
}, {deep: true})

const handleMarkdownEditorResize = ({currentPositionDiff}: ResizeEventArgs) => {
    const node = _node.value
    if (!node) return
    node.position.x += currentPositionDiff.x
    node.position.y += currentPositionDiff.y
}

type MarkdownEditorResizeStartSizePosition = {
    size: { width: number, height: number },
    position: { x: number, y: number },
}

let markdownResizeStartSizePosition: MarkdownEditorResizeStartSizePosition | undefined

const handleMarkdownEditorResizeStart = () => {
    const node = _node.value
    if (!node) return
    markdownResizeStartSizePosition = {
        size: {
            width: markdownContentSize.value.width,
            height: markdownContentSize.value.height,
        },
        position: {
            x: node.position.x,
            y: node.position.y,
        }
    }
}

const handleMarkdownEditorResizeStop = () => {
    if (!markdownResizeStartSizePosition) return
    const node = _node.value
    if (!node) return

    recordNodeResize(props.id, {
        oldSize: markdownResizeStartSizePosition.size,
        oldPosition: markdownResizeStartSizePosition.position,
        newSize: {
            width: markdownContentSize.value.width,
            height: markdownContentSize.value.height,
        },
        newPosition: {
            x: node.position.x,
            y: node.position.y,
        },
    })
}

// 阻止 splitter drag
watch(() => markdownEditorRef.value?.containerRef, async (container) => {
    if (container) {
        await nextTick()
        const splitters = container.querySelectorAll('.splitpanes__splitter')
        for (const splitter of splitters) {
            splitter.classList.add('noDrag')
        }
    }
}, {immediate: true})

// 节点行为
const handleNodeSelect = () => {
    if (isSelectionPlural.value) return
    if (canMultiSelect.value) return
    selectNode(props.id, props.layer.vueFlow)
}

const handleNodeFocus = () => {
    if (canMultiSelect.value) return
    if (!props.selected) return
    isFocus.value = true
    if (dataTypeOrDefault.value === 'text') {
        inputRef.value?.el?.focus()
    } else if (dataTypeOrDefault.value === 'markdown') {
        if (markdownEditorValue.value.trim().length === 0 && !isMarkdownEdit.value) {
            executeToggleMarkdownEdit()
        }
    }
}

// 连接点行为
const onHandleMouseDown = (e: MouseEvent) => {
    if (e.target instanceof HTMLElement) {
        const target = e.target as HTMLElement
        target.classList.add("mousedown")
        document.documentElement.addEventListener("mouseup", () => {
            target.classList.remove("mousedown")
        }, {once: true})
    }
}

// 连接点显示
const handleVisibility = computed<boolean>(() => {
    return isFocus.value || isConnecting.value
})

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

// 切换内容类型
const executeToggleType = async () => {
    const node = _node.value
    if (!node) return

    blurActiveElement()

    await executeAsyncBatch(Symbol("ContentNode toggle type"), async () => {
        const oldWidth = node.dimensions.width
        const oldHeight = node.dimensions.height
        const oldX = node.position.x
        const oldY = node.position.y

        switch (dataTypeOrDefault.value) {
            case 'markdown':
                updateNodeData(props.id, {type: 'text', content: markdownEditorValue.value})

                // 等待 text 使得 input 出现
                await nextTick()
                // 等待 input 尺寸计算
                await nextTick()

                if (inputSize.value !== undefined) {
                    node.position.x += (oldWidth - inputSize.value.width) / 2
                }
                break
            case 'text':
                updateNodeData(props.id, {type: 'markdown'})
                if (inputSize.value !== undefined) {
                    markdownContentSize.value = {
                        width: inputSize.value.width,
                        height: inputSize.value.height,
                    }
                }
                await nextTick()
                isFocus.value = true
                node.position.x += (oldWidth - markdownContentSize.value.width) / 2
                break
        }

        // 记录节点尺寸变化以便重做时恢复至当前尺寸
        recordNodeResize(props.id, {
            oldSize: {
                width: oldWidth,
                height: oldHeight,
            },
            oldPosition: {
                x: oldX,
                y: oldY,
            },
            newSize: {
                width: node.dimensions.width,
                height: node.dimensions.height,
            },
            newPosition: {
                x: node.position.x,
                y: node.position.y,
            },
        })
    })
}

// 删除
const executeDelete = () => {
    if (dataTypeOrDefault.value === 'markdown' && markdownEditorValue.value !== props.data.content) {
        updateNodeData(props.id, {content: markdownEditorValue.value})
    }
    blurActiveElement()
    remove({nodes: [props.id]})
}
</script>

<template>
    <div
        class="content-node"
        style="overflow: visible;"
    >
        <div
            class="fit-parent"
            style="overflow: visible;"
            @mousedown.capture="handleNodeSelect"
            @touchstart.capture="handleNodeSelect"
        >
            <div
                v-if="dataTypeOrDefault === 'text'"
                :style="inputWrapperStyle"
                @click.capture="handleNodeFocus"
            >
                <FitSizeBlockInput
                    ref="inputRef"
                    :class="{untouchable: !isFocus, noDrag: isFocus}"
                    :style="{borderColor}"
                    v-model="inputValue"
                    @resize="handleInputResize"
                    @blur="handleInputBlur"
                />
            </div>

            <div
                v-else-if="dataTypeOrDefault === 'markdown'"
                class="fit-parent"
                style="overflow: visible;"
                @click.capture="handleNodeFocus"
            >
                <ResizeWrapper
                    ref="MarkdownEditorResizeRef"
                    v-model="markdownContentSize"
                    :zoom="zoom"
                    :min-width="ContentNode_Markdown_minWidth"
                    :min-height="ContentNode_Markdown_minHeight"
                    :disabled="!isFocus"
                    :class="{noWheel: isResizing}"
                    @resize="handleMarkdownEditorResize"
                    @resize-start="handleMarkdownEditorResizeStart"
                    @resize-stop="handleMarkdownEditorResizeStop"
                >
                    <MarkdownCompositeEditor
                        v-if="isMarkdownEdit"
                        ref="markdownEditorRef"
                        class="fit-parent"
                        editor-class="noDrag noWheel"
                        :preview-class="{noDrag: true, noWheel: isMarkdownEditorPreviewOverflow}"
                        toolbar-class="noDrag"
                        v-model="markdownEditorValue"
                        :theme="markdownEditorTheme"
                        :zoom="isMarkdownEditorFullScreen ? 1 : zoom"
                        :full-screen-teleport-target="`#${MIND_MAP_CONTAINER_ID}`"
                        full-screen-z-index="var(--editor-full-screen-z-index)"
                        :show-toolbar="markdownEditorRef?.isFullScreen ?? false"
                        @blur="handleMarkdownEditorBlur"
                        @click.capture="stopCtrlClickWhenMarkdownEdit"
                    />
                    <MarkdownPreview
                        v-else
                        ref="markdownPreviewRef"
                        class="fit-parent"
                        :class="{untouchable: !isFocus, noDrag: isFocus, noWheel: isFocus && isMarkdownPreviewOverflow, 'hide-scroll': !isFocus}"
                        :style="{borderColor, scrollbarGutter: isFocus ? 'auto' : 'unset'}"
                        :value="data.content"
                    />
                </ResizeWrapper>
            </div>

            <Handle
                v-for="handle in ContentNodeHandles"
                :id="handle"
                :position="handle"
                @mousedown="onHandleMouseDown"
                :class="{show: handleVisibility}"
            />
        </div>

        <NodeToolbar :node-id="id" :is-visible="selected && isFocus" class="toolbar">
            <button @mousedown.capture.prevent.stop="executeCopy">
                <IconCopy/>
            </button>

            <button @mousedown.capture.prevent.stop="executeFocus">
                <IconFocus/>
            </button>

            <button @mousedown.capture.prevent.stop="executeToggleType">
                <IconMarkdown v-if="dataTypeOrDefault === 'text'"/>
                <IconMarkdownOff v-else-if="dataTypeOrDefault === 'markdown'"/>
            </button>

            <button @mousedown.capture.prevent.stop="executeDelete">
                <IconDelete/>
            </button>

            <br>

            <button
                v-if="dataTypeOrDefault === 'markdown'"
                @mousedown.capture.prevent.stop="executeToggleMarkdownEdit"
            >
                <IconCheck v-if="isMarkdownEdit"/>
                <IconEdit v-else/>
            </button>

            <button
                v-if="dataTypeOrDefault === 'markdown' && isMarkdownEdit"
                @mousedown.capture.prevent.stop="executeToggleMarkdownFullScreen"
            >
                <IconFullScreen/>
            </button>
        </NodeToolbar>
    </div>
</template>

<style scoped>
.content-node {
    width: 100%;
    height: 100%;
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
    min-width: 0;
    min-height: 0;
    width: 0;
    height: 0;
    border: none;
    overflow: visible;
}

:deep(.vue-flow__handle).show::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background: var(--border-color);
    box-sizing: border-box;
    border: var(--border);
    border-width: 2px;
    border-color: var(--background-color);
    border-radius: 100%;
}

:deep(.vue-flow__handle.mousedown).show::before {
    background: var(--primary-color);
}

:deep(.vue-flow__handle.connecting).show::before {
    background: var(--primary-color);
}

.toolbar > button {
    padding: 0.3rem;
    margin-right: 0.3rem;
    margin-top: 0.3rem;
    transition: background-color 0.3s ease;
}

.toolbar > button:hover {
    background-color: var(--background-color-hover);
}

.hide-scroll::-webkit-scrollbar-thumb {
    background-color: transparent;
}

.markdown-preview {
    padding-left: 8px;
    padding-top: 8px;
}

.markdown-preview,
:deep(.fit-size-block-input) {
    color: var(--text-color);
    background-color: var(--background-color);
    border: var(--border);
    border-radius: var(--border-radius);
    transition: border-color 0.3s ease;
}
</style>
