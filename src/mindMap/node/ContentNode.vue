<script setup lang="ts">
import {Handle, NodeProps} from "@vue-flow/core";
import {
    ContentNode,
    ContentNodeData,
    ContentNodeHandles, ContentType, ContentType_DEFAULT,
    RawMindMapLayer,
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
import MarkdownEditor from "@/components/markdown/editor/MarkdownEditor.vue";
import MarkdownPreview from "@/components/markdown/preview/MarkdownPreview.vue";
import ResizeWrapper from "@/components/resizer/ResizeWrapper.vue";
import {ResizeEventArgs, ResizeStopEventArgs} from "@/components/resizer/ResizeWrapperType.ts";
import IconEdit from "@/components/icons/IconEdit.vue";
import IconPreview from "@/components/icons/IconPreview.vue";
import IconMarkdown from "@/components/icons/IconMarkdown.vue";
import IconMarkdownOff from "@/components/icons/IconMarkdownOff.vue";

const {isTouchDevice} = useDeviceStore()

const {meta} = useMindMapMetaStore()

const {
    updateNodeData,
    isSelectionPlural,
    canMultiSelect,
    findNode,
    selectNode,
    resizeNode,
    copy,
    paste,
    fitRect,
    remove,
    currentViewport,
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

const inputWidth = ref(0)
const inputHeight = ref(0)

const handleInputResize = (size: { width: number, height: number }) => {
    const node = _node.value
    if (node) {
        // 保持 node 居中
        node.position.x = node.position.x - (size.width - inputWidth.value) / 2
        node.width = size.width
        node.height = size.height
    }
    inputWidth.value = size.width
    inputHeight.value = size.height
}

const handleInputBlur = () => {
    isFocus.value = false
}

// markdown 模式
const markdownEditorRef = useTemplateRef<InstanceType<typeof MarkdownEditor>>("markdownEditorRef")

const markdownEditorValue = ref<string>(props.data.content)

const isMarkdownEdit = ref(false)

watch(() => props.data.content, (value) => {
    if (value !== markdownEditorValue.value) {
        markdownEditorValue.value = value
    }
})

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

// markdown 编辑器尺寸
const MarkdownEditorResizeRef = useTemplateRef<InstanceType<typeof ResizeWrapper>>("MarkdownEditorResizeRef")

const isResizing = computed(() => MarkdownEditorResizeRef.value?.isResizing ?? false)

const markdownContentSize = ref({
    height: 0,
    width: 0,
})

onMounted(async () => {
    const node = _node.value
    if (node) {
        await nextTick()
        markdownContentSize.value = {
            width: node.dimensions.width,
            height: node.dimensions.height,
        }
    }
})

watch(() => _node.value?.dimensions.width, (width) => {
    if (width !== undefined && markdownContentSize.value.width !== width) {
        markdownContentSize.value.width = width
    }
})
watch(() => _node.value?.dimensions.height, (height) => {
    if (height !== undefined && markdownContentSize.value.height !== height) {
        markdownContentSize.value.height = height
    }
})
watch(() => markdownContentSize.value, (size) => {
    const node = _node.value
    if (node) {
        node.height = size.height
        node.width = size.width
    }
}, {deep: true})

const handleMarkdownEditorResize = ({direction, currentDiff}: ResizeEventArgs) => {
    const node = _node.value
    if (node) {
        switch (direction) {
            case "top":
            case "top-left":
            case "top-right":
                node.position.y -= currentDiff.y
                break
        }
        switch (direction) {
            case "left":
            case "top-left":
            case "bottom-left":
                node.position.x -= currentDiff.x
                break
        }
    }
}

const handleMarkdownEditorResizeStop = ({origin, direction, diff}: ResizeStopEventArgs) => {
    const node = _node.value
    if (node) {
        const oldPosition =  {
            x: node.position.x,
            y: node.position.y,
        }

        if (node) {
            switch (direction) {
                case "top":
                case "top-left":
                case "top-right":
                    oldPosition.y -= diff.y
                    break
            }
            switch (direction) {
                case "left":
                case "top-left":
                case "bottom-left":
                    oldPosition.x -= diff.x
                    break
            }
        }

        resizeNode(props.id, {
            oldSize: {
                width: origin.width,
                height: origin.height,
            },
            newSize: {
                width: markdownContentSize.value.width,
                height: markdownContentSize.value.height,
            },
            oldPosition,
            newPosition: {
                x: node.position.x,
                y: node.position.y,
            },
        })
    }
}

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
const executeToggleType = () => {
    blurActiveElement()
    switch (props.data.type) {
        case 'markdown':
            updateNodeData(props.id, {type: 'text', content: markdownEditorValue.value})
            isMarkdownEdit.value = false

            // 保持 node 居中且顶部高度不变
            const node = _node.value
            if (node) {
                const oldWidth = node.dimensions.width
                nextTick(() => {
                    const node = _node.value
                    if (node) {
                        node.position.x += (oldWidth - inputWidth.value) / 2
                    }
                })
            }
            break
        case 'text':
            updateNodeData(props.id, {type: 'markdown'})
            isMarkdownEdit.value = false
            isFocus.value = true
            markdownContentSize.value = {
                width: inputWidth.value,
                height: inputHeight.value,
            }
            break
    }
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
                :style="{width: `${inputWidth}px`, height: `${inputHeight}px`}"
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
                    :scale="currentViewport.zoom"
                    :disabled="!isFocus"
                    :class="{noWheel: isResizing}"
                    @resize="handleMarkdownEditorResize"
                    @resize-stop="handleMarkdownEditorResizeStop"
                >
                    <MarkdownEditor
                        v-if="isMarkdownEdit"
                        ref="markdownEditorRef"
                        class="fit-parent noDrag noWheel"
                        v-model="markdownEditorValue"
                        :theme="meta.currentTheme"
                        @blur="handleMarkdownEditorBlur"
                    />
                    <MarkdownPreview
                        v-else
                        class="fit-parent"
                        :class="{untouchable: !isFocus, noDrag: isFocus}"
                        :style="{borderColor, overflow: isFocus ? 'auto' : 'hidden', scrollbarGutter: isFocus ? 'auto' : 'unset'}"
                        :value="data.content"
                    />
                </ResizeWrapper>
            </div>

            <Handle
                v-for="handle in ContentNodeHandles"
                :id="handle"
                :position="handle"
                @mousedown="onHandleMouseDown"
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
                <IconPreview v-if="isMarkdownEdit"/>
                <IconEdit v-else/>
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
    margin-top: 0.3rem;
    transition: background-color 0.3s ease;
}

.toolbar > button:hover {
    background-color: var(--background-color-hover);
}
</style>
