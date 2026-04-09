<script setup lang="ts">
import {Handle, type NodeProps} from '@vue-flow/core';
import {NodeResizer, type OnResize} from '@vue-flow/node-resizer';
import '@vue-flow/node-resizer/dist/style.css';
import {MIND_MAP_CONTAINER_ID, useMindMap} from '@/mindMap/useMindMap.ts';
import {computed, nextTick, ref, useTemplateRef, watch} from 'vue';
import FitSizeBlockInput from '@/components/input/FitSizeBlockInput.vue';
import {NodeToolbar} from '@vue-flow/node-toolbar';
import IconDelete from '@/components/icons/IconDelete.vue';
import IconCopy from '@/components/icons/IconCopy.vue';
import IconFocus from '@/components/icons/IconFocus.vue';
import {blurActiveElement, getMatchedElementOrParent} from '@/utils/event/judgeEventTarget.ts';
import {useMindMapStore} from '@/store/mindMapStore.ts';
import MarkdownPreview from '@/components/markdown/preview/MarkdownPreview.vue';
import IconEdit from '@/components/icons/IconEdit.vue';
import IconCheck from '@/components/icons/IconCheck.vue';
import IconMarkdown from '@/components/icons/IconMarkdown.vue';
import IconMarkdownOff from '@/components/icons/IconMarkdownOff.vue';
import {type RawMindMapLayer} from '@/mindMap/layer/MindMapLayer.ts';
import {
    type ContentNode,
    ContentNode_minHeight,
    ContentNode_minWidth,
    type ContentNodeData,
    ContentNodeHandles,
    type ContentType,
    ContentType_DEFAULT,
} from '@/mindMap/node/ContentNode.ts';
import MarkdownCompositeEditor from '@/components/markdown/compositeEditor/MarkdownCompositeEditor.vue';
import IconFullScreen from '@/components/icons/IconFullScreen.vue';
import {
    emitResizeWithHelperLine,
    type NodeResizeOrigin,
} from '@/mindMap/helperLines/resize/emitResizeWithHelperLine.ts';

const {meta} = useMindMapStore();

const {
    currentLayer,
    updateNodeData,
    graphSelection,
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
} = useMindMap();

const props = defineProps<
    NodeProps<ContentNodeData> & {
        layer: RawMindMapLayer;
    }
>();

const _node = computed(() => findNode(props.id, props.layer.vueFlow));

const dataTypeOrDefault = computed<ContentType>(() => props.data.type ?? ContentType_DEFAULT);

// 是否已聚焦
const isFocus = ref(false);

watch(
    () => props.selected,
    (value, oldValue) => {
        if (!value && oldValue) {
            isFocus.value = false;
            isMarkdownEdit.value = false;
        }
    },
);

// text input 模式
const inputRef = useTemplateRef<InstanceType<typeof FitSizeBlockInput>>('inputRef');

const inputValue = computed<string>({
    get() {
        return props.data.content;
    },
    set(newVal: string) {
        if (newVal !== props.data.content) {
            updateNodeData(props.id, {content: newVal});
        }
    },
});

type NodeSize = {
    width: number;
    height: number;
};

const inputSize = ref<NodeSize>();

const inputWrapperStyle = computed(() => {
    return {
        width: (inputSize.value?.width ?? 0) + 'px',
        height: (inputSize.value?.height ?? 0) + 'px',
    };
});

const handleInputResize = (size: NodeSize) => {
    const node = _node.value;
    if (node) {
        if (inputSize.value !== undefined) {
            // 保持 node 居中
            node.position.x = node.position.x - (size.width - inputSize.value.width) / 2;
        }
        node.width = size.width;
        node.height = size.height;
        node.dimensions.width = size.width;
        node.dimensions.height = size.height;
    }
    inputSize.value = size;
};

const handleInputBlur = () => {
    isFocus.value = false;
};

// markdown 模式
const markdownEditorRef =
    useTemplateRef<InstanceType<typeof MarkdownCompositeEditor>>('markdownEditorRef');
const markdownPreviewRef =
    useTemplateRef<InstanceType<typeof MarkdownPreview>>('markdownPreviewRef');

const markdownEditorValue = ref<string>(props.data.content);

const isMarkdownEdit = ref(false);

watch(
    () => props.layer.lock,
    (locked) => {
        if (locked) {
            isMarkdownEdit.value = false;
        }
    },
    {immediate: true},
);

const isMarkdownEditorFullScreen = computed<boolean>(
    () => markdownEditorRef.value?.isFullScreen ?? false,
);
const isMarkdownEditorPreviewOverflow = computed<boolean>(
    () => markdownEditorRef.value?.markdownPreviewRef?.isOverflow ?? false,
);
const isMarkdownPreviewOverflow = computed<boolean>(
    () => markdownPreviewRef.value?.isOverflow ?? false,
);

const markdownEditorTheme = computed(() => {
    return meta.value.currentTheme === 'dark' ? 'vs-dark' : 'vs';
});

watch(
    () => props.data.content,
    (value) => {
        if (value !== markdownEditorValue.value) {
            markdownEditorValue.value = value;
        }
    },
    {immediate: true},
);

const handleMarkdownEditorBlur = () => {
    if (markdownEditorValue.value !== props.data.content) {
        updateNodeData(props.id, {content: markdownEditorValue.value});
    }
};

watch(
    () => isMarkdownEdit.value,
    (isEdit) => {
        // 当退出编辑模式时，如果内容有修改，则更新数据
        if (!isEdit && markdownEditorValue.value !== props.data.content) {
            updateNodeData(props.id, {content: markdownEditorValue.value});
        }
    },
);

// 切换编辑模式
const executeToggleMarkdownEdit = async () => {
    isMarkdownEdit.value = !isMarkdownEdit.value;
    if (isMarkdownEdit.value) {
        await nextTick();
        markdownEditorRef.value?.editorRef?.focus();
    }
};

// 切换编辑全屏
const executeToggleMarkdownFullScreen = () => {
    markdownEditorRef.value?.toggleFullScreen();
};

// 阻止编辑时切换选中
const stopCtrlClickWhenMarkdownEdit = (e: MouseEvent) => {
    if (isMarkdownEdit.value && e.ctrlKey) {
        e.stopPropagation();
    }
};

// markdown 编辑器尺寸
const isResizing = ref(false);
let markdownResizeOrigin: NodeResizeOrigin | undefined;

const handleMarkdownEditorResize = (args: OnResize) => {
    if (!markdownResizeOrigin) return;
    const node = _node.value;
    if (!node) return;
    emitResizeWithHelperLine(node, markdownResizeOrigin, args);
};

const handleMarkdownEditorResizeStart = () => {
    const node = _node.value;
    if (!node) return;
    isResizing.value = true;
    markdownResizeOrigin = {
        width: node.dimensions.width,
        height: node.dimensions.height,
        x: node.position.x,
        y: node.position.y,
    };
};

const handleMarkdownEditorResizeEnd = () => {
    isResizing.value = false;
    if (!markdownResizeOrigin) return;
    const node = _node.value;
    if (!node) return;

    if (
        node.dimensions.width === markdownResizeOrigin.width &&
        node.dimensions.height === markdownResizeOrigin.height &&
        node.position.x === markdownResizeOrigin.x &&
        node.position.y === markdownResizeOrigin.y
    )
        return;

    recordNodeResize(props.id, {
        oldSize: {
            width: markdownResizeOrigin.width,
            height: markdownResizeOrigin.height,
        },
        oldPosition: {
            x: markdownResizeOrigin.x,
            y: markdownResizeOrigin.y,
        },
        newSize: {
            width: node.dimensions.width,
            height: node.dimensions.height,
        },
        newPosition: {
            x: node.position.x,
            y: node.position.y,
        },
    });

    markdownResizeOrigin = undefined;
};

// 阻止 splitter drag
watch(
    () => markdownEditorRef.value?.containerRef,
    async (container) => {
        if (container) {
            await nextTick();
            const splitters = container.querySelectorAll('.splitpanes__splitter');
            for (const splitter of splitters) {
                splitter.classList.add('noDrag');
            }
        }
    },
    {immediate: true},
);

// 节点行为
const handleNodeSelect = () => {
    if (graphSelection.selectedCount.value > 1) return;
    if (canMultiSelect.value) return;
    selectNode(props.id, props.layer.vueFlow);
};

const handleNodeFocus = () => {
    if (canMultiSelect.value) return;
    if (!props.selected) return;
    isFocus.value = true;
    if (dataTypeOrDefault.value === 'text') {
        inputRef.value?.el?.focus();
    } else if (dataTypeOrDefault.value === 'markdown') {
        if (markdownEditorValue.value.trim().length === 0 && !isMarkdownEdit.value) {
            executeToggleMarkdownEdit();
        }
    }
};

// 连接点行为
const onHandleMouseDown = (e: MouseEvent) => {
    if (e.target instanceof HTMLElement) {
        const target = e.target as HTMLElement;
        target.classList.add('mousedown');
        document.documentElement.addEventListener(
            'mouseup',
            () => {
                target.classList.remove('mousedown');
            },
            {once: true},
        );
    }
};

// 连接点显示
const isHandleVisible = computed<boolean>(() => {
    return (
        (isFocus.value || isConnecting.value) &&
        !props.layer.lock &&
        props.layer.id === currentLayer.value.id
    );
});

// 通过按钮的复制和点击粘贴
let cleanClickPasteTimeout: number | undefined = undefined;

const clickPaste = (e: MouseEvent) => {
    if (e.target instanceof HTMLElement) {
        if (
            getMatchedElementOrParent(
                e.target,
                (el) =>
                    el.classList.contains('vue-flow__nodes') ||
                    el.classList.contains('vue-flow__edges'),
            ) !== null
        ) {
            return;
        } else if (
            getMatchedElementOrParent(e.target, (el) => el.classList.contains('vue-flow__pane')) !==
            null
        ) {
            paste();
            document.documentElement.removeEventListener('click', clickPaste);
            clearTimeout(cleanClickPasteTimeout);
        }
    }
};

const executeButtonCopy = () => {
    const node = _node.value;
    if (node === undefined) return;

    blurActiveElement();
    copy({nodes: [node] as any as ContentNode[], edges: []}, props.layer);

    // 在复制后的下一次点击中执行粘贴
    // 一段时间后移除粘贴动作
    cleanClickPasteTimeout = setTimeout(() => {
        document.documentElement.removeEventListener('click', clickPaste);
        clearTimeout(cleanClickPasteTimeout);
    }, 10000);
    document.documentElement.addEventListener('click', clickPaste);
};

// 边框颜色
const borderColor = computed(() => {
    if (props.selected) {
        return 'var(--primary-color)';
    } else if (props.data.withBorder === true) {
        return 'var(--border-color)';
    } else if (props.data.withBorder !== undefined) {
        return 'transparent';
    } else {
        return 'var(--border-color)';
    }
});

// 聚焦
const executeFocus = () => {
    const node = _node.value;
    if (node !== undefined) {
        fitRect({
            x: node.position.x,
            y: node.position.y,
            width: node.dimensions.width,
            height: node.dimensions.height,
        });
    }
};

// 切换内容类型
const executeToggleType = async () => {
    const node = _node.value;
    if (!node) return;

    blurActiveElement();

    await executeAsyncBatch(Symbol('ContentNode toggle type'), async () => {
        const oldWidth = node.dimensions.width;
        const oldHeight = node.dimensions.height;
        const oldX = node.position.x;
        const oldY = node.position.y;

        switch (dataTypeOrDefault.value) {
            case 'markdown': {
                updateNodeData(props.id, {type: 'text', content: markdownEditorValue.value});

                // 等待 text 使得 input 出现
                await nextTick();
                // 等待 input 尺寸计算
                await nextTick();

                if (inputSize.value !== undefined) {
                    node.position.x += (oldWidth - inputSize.value.width) / 2;
                }
                break;
            }

            case 'text': {
                updateNodeData(props.id, {type: 'markdown'});
                await nextTick();
                isFocus.value = true;
                break;
            }
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
        });
    });
};

// 删除
const executeDelete = () => {
    if (
        dataTypeOrDefault.value === 'markdown' &&
        markdownEditorValue.value !== props.data.content
    ) {
        updateNodeData(props.id, {content: markdownEditorValue.value});
    }
    blurActiveElement();
    remove({nodes: [props.id]});
};
</script>

<template>
    <div
        class="content-node"
        style="overflow: visible"
        :style="{width: dimensions.width + 'px', height: dimensions.height + 'px'}"
        :class="{noDrag: layer.lock}"
    >
        <div
            class="fit-parent"
            style="overflow: visible"
            @mousedown.capture="handleNodeSelect"
            @touchstart.capture.passive="handleNodeSelect"
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
                    :readonly="layer.lock"
                    @resize="handleInputResize"
                    @blur="handleInputBlur"
                />
            </div>

            <div
                v-else-if="dataTypeOrDefault === 'markdown'"
                class="fit-parent"
                style="overflow: visible"
                @click.capture="handleNodeFocus"
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
                    :class="{
                        untouchable: !isFocus,
                        noDrag: isFocus,
                        noWheel: isFocus && isMarkdownPreviewOverflow,
                        'hide-scroll': !isFocus,
                    }"
                    :style="{borderColor}"
                    :value="data.content"
                />
            </div>
        </div>

        <NodeResizer
            :node-id="id"
            :is-visible="data.type === 'markdown' && isFocus && !layer.lock"
            :class="{noWheel: isResizing}"
            :min-width="ContentNode_minWidth"
            :min-height="ContentNode_minHeight"
            @resize="handleMarkdownEditorResize"
            @resize-start="handleMarkdownEditorResizeStart"
            @resize-end="handleMarkdownEditorResizeEnd"
        />

        <Handle
            v-for="handle in ContentNodeHandles"
            :key="handle"
            :id="handle"
            :position="handle"
            @mousedown="onHandleMouseDown"
            :class="{visible: isHandleVisible}"
        />

        <NodeToolbar
            :node-id="id"
            :is-visible="selected && isFocus"
            class="toolbar"
        >
            <button @mousedown.capture.prevent.stop="executeButtonCopy">
                <IconCopy />
            </button>

            <button @mousedown.capture.prevent.stop="executeFocus">
                <IconFocus />
            </button>

            <button
                @mousedown.capture.prevent.stop="executeToggleType"
                v-if="!layer.lock"
            >
                <IconMarkdown v-if="dataTypeOrDefault === 'text'" />
                <IconMarkdownOff v-else-if="dataTypeOrDefault === 'markdown'" />
            </button>

            <button
                @mousedown.capture.prevent.stop="executeDelete"
                v-if="!layer.lock"
            >
                <IconDelete />
            </button>

            <br />

            <button
                v-if="dataTypeOrDefault === 'markdown' && !layer.lock"
                @mousedown.capture.prevent.stop="executeToggleMarkdownEdit"
            >
                <IconCheck v-if="isMarkdownEdit" />
                <IconEdit v-else />
            </button>

            <button
                v-if="dataTypeOrDefault === 'markdown' && isMarkdownEdit"
                @mousedown.capture.prevent.stop="executeToggleMarkdownFullScreen"
            >
                <IconFullScreen />
            </button>
        </NodeToolbar>
    </div>
</template>

<style scoped>
.content-node {
    position: relative;
}

.content-node .fit-parent {
    height: 100%;
    width: 100%;
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

:deep(.vue-flow__handle).visible::before {
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

:deep(.vue-flow__handle.mousedown).visible::before {
    background: var(--primary-color);
}

:deep(.vue-flow__handle.connecting).visible::before {
    background: var(--primary-color);
}

:deep(.vue-flow__resize-control.handle) {
    background: var(--primary-color);
    border: none;
    border-radius: 0;
}

:deep(.vue-flow__resize-control.line) {
    border-color: var(--primary-color);
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
    scrollbar-gutter: stable;
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
