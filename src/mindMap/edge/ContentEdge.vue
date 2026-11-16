<script setup lang="ts">
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    useTemplateRef,
    watch,
} from 'vue';
import {BaseEdge, type EdgeProps, type XYPosition} from '@vue-flow/core';
import {MIND_MAP_CONTAINER_ID, useMindMap} from '@/mindMap/useMindMap.ts';
import FitSizeBlockInput from '@/components/input/FitSizeBlockInput.vue';
import {useEdgeUpdaterTouch} from '@/mindMap/edge/useEdgeUpdaterTouch.ts';
import AutoResizeForeignObject from '@/mindMap/svg/AutoResizeForeignObject.vue';
import IconDelete from '@/components/icons/IconDelete.vue';
import IconFocus from '@/components/icons/IconFocus.vue';
import {blurActiveElement} from '@/utils/event/judgeEventTarget.ts';
import {getPaddingBezierPath} from '@/mindMap/edge/paddingBezierPath.ts';
import {v7 as uuid} from 'uuid';
import {type RawMindMapLayer} from '@/mindMap/layer/MindMapLayer.ts';
import {type SizePositionEdgePartial} from '@/mindMap/edge/SizePositionEdge.ts';
import {
    ContentEdge_strokeWidth_DEFAULT,
    ContentEdge_strokeWidth_MAX,
    ContentEdge_strokeWidth_MIN,
    ContentEdgeArrowShape_CONSTANTS,
    type ContentEdgeArrowShape,
    type ContentEdgeData,
} from '@/mindMap/edge/ContentEdge.ts';
import ControlPointLine from '@/mindMap/edge/controlPoint/ControlPointLine.vue';
import MarkdownPreview from '@/components/markdown/preview/MarkdownPreview.vue';
import MarkdownCompositeEditor from '@/components/markdown/compositeEditor/MarkdownCompositeEditor.vue';
import IconSettings from '@/components/icons/IconSettings.vue';
import Dialog from '@/components/dialog/Dialog.vue';
import CustomSelect from '@/components/select/CustomSelect.vue';
import {createOptions} from '@/components/select/createOptions.ts';
import {translate} from '@/store/i18nStore.ts';
import IconEdit from '@/components/icons/IconEdit.vue';
import IconCheck from '@/components/icons/IconCheck.vue';
import IconFullScreen from '@/components/icons/IconFullScreen.vue';
import {useMindMapStore} from '@/store/mindMapStore.ts';
import {
    type ContentType,
    ContentType_DEFAULT,
    Content_minWidth,
    Content_minHeight,
} from '@/mindMap/ContentType.ts';
import ContentResizeHandles from '@/mindMap/resize/ContentResizeHandles.vue';

const {
    updateEdgeData,
    graphSelection,
    canMultiSelect,
    findEdge,
    selectEdge,
    fitRect,
    remove,
    zoom,
    executeAsyncBatch,
} = useMindMap();
const {meta} = useMindMapStore();

const props = defineProps<
    EdgeProps<ContentEdgeData> & {
        layer: RawMindMapLayer;
    }
>();

const _edge = computed(() => findEdge(props.id, props.layer.vueFlow));

// 内容类型
const dataTypeOrDefault = computed<ContentType>(() => props.data.type ?? ContentType_DEFAULT);

const innerValue = computed<string>({
    get() {
        return props.data.content;
    },
    set(newVal) {
        updateEdgeData(props.id, {content: newVal});
    },
});

const inputWidth = ref(0);
const inputHeight = ref(0);

const handleInputResize = (size: {width: number; height: number}) => {
    inputWidth.value = size.width;
    inputHeight.value = size.height;
};

// 是否已聚焦（输入框显示 + 工具栏显示）
const isFocus = ref(false);
const inputRef = useTemplateRef<InstanceType<typeof FitSizeBlockInput>>('inputRef');

// 监听选中状态变化，取消选中时重置聚焦状态
watch(
    () => props.selected,
    (value, oldValue) => {
        if (!value && oldValue) {
            isFocus.value = false;
            isMarkdownEdit.value = false;
        }
    },
);

const handleEdgeMouseDown = () => {
    if (graphSelection.selectedCount.value > 1) return;
    if (canMultiSelect.value) return;
    selectEdge(props.id, props.layer.vueFlow);
};

const handleClick = () => {
    if (canMultiSelect.value) return;
    if (!props.selected) return;
    isFocus.value = true;
    if (props.layer.lock) return;
    if (dataTypeOrDefault.value === 'text') {
        nextTick(() => {
            inputRef.value?.el?.focus();
        });
    } else if (dataTypeOrDefault.value === 'markdown') {
        if (isMarkdownEdit.value) {
            markdownEditorRef.value?.editorRef?.focus();
        } else if (markdownEditorValue.value.trim().length === 0) {
            executeToggleMarkdownEdit();
        }
    }
};

const handleBlur = () => {
    isFocus.value = false;
};

// markdown 模式
const markdownEditorRef =
    useTemplateRef<InstanceType<typeof MarkdownCompositeEditor>>('markdownEditorRef');
const markdownPreviewRef =
    useTemplateRef<InstanceType<typeof MarkdownPreview>>('markdownPreviewRef');

const markdownEditorValue = ref<string>(props.data.content);
const isMarkdownEdit = ref(false);

// markdown 内容框尺寸（未手动调整时为最小尺寸，进入编辑时取内容自然尺寸）
const markdownSize = ref<{width: number; height: number}>(
    props.data.contentSize ?? {
        width: Content_minWidth,
        height: Content_minHeight,
    },
);

// markdown 预览自适应时的自然尺寸，用于进入编辑/撤销回无尺寸状态
const lastPreviewSize = ref<{width: number; height: number}>();

// 是否正在拖动尺寸控制点（预览态下拖动时需要临时固定内容框尺寸）
const isResizingMarkdown = ref(false);

const hasFixedMarkdownBox = computed(
    () => isMarkdownEdit.value || isResizingMarkdown.value || props.data.contentSize !== undefined,
);

const markdownWrapperStyle = computed(() => {
    if (!hasFixedMarkdownBox.value) return undefined;
    return {
        width: `${markdownSize.value.width}px`,
        height: `${markdownSize.value.height}px`,
    };
});

const layoutMarkdownEditor = async () => {
    await nextTick();
    markdownEditorRef.value?.editorRef?.layout();
};

// 预览自适应时记录内容尺寸，保证进入编辑后与预览一致
watch(
    () => [inputWidth.value, inputHeight.value] as const,
    ([width, height]) => {
        if (
            dataTypeOrDefault.value !== 'markdown' ||
            isMarkdownEdit.value ||
            isResizingMarkdown.value ||
            props.data.contentSize !== undefined
        )
            return;

        const size = {
            width: Math.max(Content_minWidth, width),
            height: Math.max(Content_minHeight, height),
        };
        lastPreviewSize.value = size;
        markdownSize.value = size;
    },
);

const handleMarkdownResize = (size: {width: number; height: number}) => {
    isResizingMarkdown.value = true;
    markdownSize.value = size;
    // 内容框尺寸变化后需要手动触发 Monaco 重新布局（foreignObject 内不会自动布局）
    void layoutMarkdownEditor();
};

const handleMarkdownResizeEnd = (size: {width: number; height: number}) => {
    isResizingMarkdown.value = false;
    markdownSize.value = size;
    updateEdgeData(props.id, {contentSize: size});
};

// 撤销/重做后同步内容框尺寸
watch(
    () => props.data.contentSize,
    (size) => {
        if (size !== undefined) {
            markdownSize.value = {width: size.width, height: size.height};
        } else {
            markdownSize.value = lastPreviewSize.value ?? {
                width: Content_minWidth,
                height: Content_minHeight,
            };
        }
        void layoutMarkdownEditor();
    },
);

watch(
    () => props.layer.lock,
    (locked) => {
        if (locked) {
            isMarkdownEdit.value = false;
        }
    },
    {immediate: true},
);

const markdownEditorTheme = computed(() => {
    return meta.value.currentTheme === 'dark' ? 'vs-dark' : 'vs';
});

const isMarkdownEditorFullScreen = computed<boolean>(
    () => markdownEditorRef.value?.isFullScreen ?? false,
);

// 同步外部数据变化到 markdownEditorValue
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
        updateEdgeData(props.id, {content: markdownEditorValue.value});
    }
};

watch(
    () => isMarkdownEdit.value,
    (isEdit) => {
        // 当退出编辑模式时，如果内容有修改，则更新数据
        if (!isEdit && markdownEditorValue.value !== props.data.content) {
            updateEdgeData(props.id, {content: markdownEditorValue.value});
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

// 工具栏
const toolBarWidth = ref(0);
const toolBarHeight = ref(0);

const handleToolBarResize = (size: {width: number; height: number}) => {
    toolBarWidth.value = size.width;
    toolBarHeight.value = size.height;
};

useEdgeUpdaterTouch(props.id);

// 贝塞尔曲线控制点
const sourceControlPointOffset = shallowRef<XYPosition | undefined>();
const targetControlPointOffset = shallowRef<XYPosition | undefined>();
const sourceControlFixed = ref<boolean>(!!props.data.sourceControlPointOffset);
const targetControlFixed = ref<boolean>(!!props.data.targetControlPointOffset);
watch(
    () => props.data.sourceControlPointOffset,
    (value) => {
        sourceControlFixed.value = !!value;
        sourceControlPointOffset.value = value
            ? {
                  x: value.x,
                  y: value.y,
              }
            : undefined;
    },
    {immediate: true},
);
watch(
    () => props.data.targetControlPointOffset,
    (value) => {
        targetControlFixed.value = !!value;
        targetControlPointOffset.value = value
            ? {
                  x: value.x,
                  y: value.y,
              }
            : undefined;
    },
    {immediate: true},
);
const sourceControlPoint = computed({
    get() {
        return sourceControlPointOffset.value
            ? {
                  x: props.sourceX + sourceControlPointOffset.value.x,
                  y: props.sourceY + sourceControlPointOffset.value.y,
              }
            : undefined;
    },
    set(value) {
        if (!value) return;
        sourceControlPointOffset.value = {
            x: value.x - props.sourceX,
            y: value.y - props.sourceY,
        };
    },
});
const targetControlPoint = computed({
    get() {
        return targetControlPointOffset.value
            ? {
                  x: props.targetX + targetControlPointOffset.value.x,
                  y: props.targetY + targetControlPointOffset.value.y,
              }
            : undefined;
    },
    set(value) {
        if (!value) return;
        targetControlPointOffset.value = {
            x: value.x - props.targetX,
            y: value.y - props.targetY,
        };
    },
});

// path 计算
const path = ref<string>('');

const calculateBezier = () => {
    return getPaddingBezierPath(
        {
            x: props.sourceX,
            y: props.sourceY,
            position: props.sourcePosition,
            controlPoint: sourceControlFixed.value ? sourceControlPoint.value : undefined,
            padding: 8,
        },
        {
            x: props.targetX,
            y: props.targetY,
            position: props.targetPosition,
            controlPoint: targetControlFixed.value ? targetControlPoint.value : undefined,
            padding: 8,
        },
        props.curvature,
    );
};

const controlPointWatchHandle = watch(
    () => [sourceControlPointOffset.value, targetControlPointOffset.value],
    () => {
        const bezier = calculateBezier();
        if (!bezier) return;
        path.value = bezier.path;
    },
);

watch(
    () => [
        props.sourceX,
        props.sourceY,
        props.sourcePosition,
        props.targetX,
        props.targetY,
        props.targetPosition,
    ],
    () => {
        const bezier = calculateBezier();
        if (!bezier) return;
        controlPointWatchHandle.pause();
        sourceControlPoint.value = bezier.sourceControlPoint;
        targetControlPoint.value = bezier.targetControlPoint;
        path.value = bezier.path;
        controlPointWatchHandle.resume();
    },
    {
        immediate: true,
    },
);

const handleSourceControlPointDragEnd = (value: XYPosition) => {
    updateEdgeData(props.id, {
        sourceControlPointOffset: {
            x: value.x - props.sourceX,
            y: value.y - props.sourceY,
        },
    });
};
const handleTargetControlPointDragEnd = (value: XYPosition) => {
    updateEdgeData(props.id, {
        targetControlPointOffset: {
            x: value.x - props.targetX,
            y: value.y - props.targetY,
        },
    });
};

// 两头的 marker 样式
const currentArrowId = uuid();

// 设置 Dialog 状态
const isSettingsOpen = ref(false);

// 兼容旧 arrowType 的两端有效箭头形状
const effectiveSourceArrow = computed<ContentEdgeArrowShape>(
    () => props.data.sourceArrow ?? (props.data.arrowType === 'two-way' ? 'arrow' : 'none'),
);
const effectiveTargetArrow = computed<ContentEdgeArrowShape>(
    () =>
        props.data.targetArrow ??
        (props.data.arrowType === 'one-way' || props.data.arrowType === 'two-way'
            ? 'arrow'
            : 'none'),
);
// 线宽滑块：拖动期间只做本地预览，松开时才写入历史
const strokeWidthPreview = ref<number>(
    Math.max(
        ContentEdge_strokeWidth_MIN,
        props.data.strokeWidth ?? ContentEdge_strokeWidth_DEFAULT,
    ),
);

watch(
    () => props.data.strokeWidth,
    (w) => {
        // 撤销/重做可能把线宽恢复为 undefined
        strokeWidthPreview.value = Math.max(
            ContentEdge_strokeWidth_MIN,
            w ?? ContentEdge_strokeWidth_DEFAULT,
        );
    },
);

const effectiveStrokeWidth = computed(() => strokeWidthPreview.value);

// marker 两端标识
const markerEnds = ['start', 'end'] as const;
type MarkerEnd = (typeof markerEnds)[number];
const arrowShapeOf = (end: MarkerEnd): ContentEdgeArrowShape =>
    end === 'start' ? effectiveSourceArrow.value : effectiveTargetArrow.value;

const markerStart = computed<string | undefined>(() =>
    arrowShapeOf('start') !== 'none' ? `url(#${currentArrowId}-start)` : undefined,
);
const markerEnd = computed<string | undefined>(() =>
    arrowShapeOf('end') !== 'none' ? `url(#${currentArrowId}-end)` : undefined,
);

// 箭头形状下拉选项（computed 以便切换语言后重新翻译）
const arrowShapeOptions = computed(() =>
    createOptions(ContentEdgeArrowShape_CONSTANTS, {
        none: translate('arrowShape_none'),
        arrow: translate('arrowShape_arrow'),
        triangle: translate('arrowShape_triangle'),
        diamond: translate('arrowShape_diamond'),
        circle: translate('arrowShape_circle'),
    }),
);

// 一次性写入两端形状并清除旧字段
const applyArrow = (end: 'source' | 'target', shape: ContentEdgeArrowShape) => {
    updateEdgeData(props.id, {
        sourceArrow: end === 'source' ? shape : effectiveSourceArrow.value,
        targetArrow: end === 'target' ? shape : effectiveTargetArrow.value,
        arrowType: undefined,
    });
};

const onSourceArrowChange = (v: ContentEdgeArrowShape | ContentEdgeArrowShape[] | undefined) => {
    applyArrow('source', v as ContentEdgeArrowShape);
};
const onTargetArrowChange = (v: ContentEdgeArrowShape | ContentEdgeArrowShape[] | undefined) => {
    applyArrow('target', v as ContentEdgeArrowShape);
};
const onStrokeWidthInput = (e: Event) => {
    strokeWidthPreview.value = Math.max(
        ContentEdge_strokeWidth_MIN,
        Number((e.target as HTMLInputElement).value),
    );
};
const onStrokeWidthChange = () => {
    if (strokeWidthPreview.value === (props.data.strokeWidth ?? ContentEdge_strokeWidth_DEFAULT))
        return;
    updateEdgeData(props.id, {strokeWidth: strokeWidthPreview.value});
};

// 贝塞尔曲线中点控制 input 位置
const bezierRef = useTemplateRef<InstanceType<typeof BaseEdge>>('bezierRef');
const curveMidpoint = ref<{x: number; y: number}>({x: 0, y: 0});

// 监听 svg 路径变化
let pathObserver: MutationObserver | undefined = undefined;

// 计算贝塞尔曲线中点
const calculateMidPoint = (path: SVGPathElement) => {
    curveMidpoint.value = path.getPointAtLength(path.getTotalLength() / 2);
};

// 同步 edge size position
const boundingClientRect = ref<DOMRect>();

// 计算 edge 外部尺寸
const calculateBoundingBox = (path: SVGPathElement) => {
    boundingClientRect.value = path.getBoundingClientRect();
};

const syncSizePosition = () => {
    const edge = _edge.value;
    if (edge !== undefined && boundingClientRect.value !== undefined) {
        const flowTransform = props.layer.vueFlow.viewport.value;
        const zoom = flowTransform.zoom;

        let {width, height, x: left, y: top} = boundingClientRect.value;

        // 计算与当前画布的偏移量
        left -= flowTransform.x;
        top -= flowTransform.y;

        // 计算缩放
        left /= zoom;
        top /= zoom;
        width /= zoom;
        height /= zoom;

        if (inputWidth.value > width) {
            left -= (inputWidth.value - width) / 2;
            width = inputWidth.value;
        }
        if (inputHeight.value > height) {
            top -= (inputHeight.value - height) / 2;
            height = inputHeight.value;
        }

        const sizePositionData: SizePositionEdgePartial['data'] = {
            position: {left, top},
            size: {width: width, height: height},
        };

        // edge size position change never emit history change
        Object.assign(edge.data, sizePositionData);
    }
};

onMounted(() => {
    const path = bezierRef.value?.$el?.nextElementSibling as SVGPathElement | undefined;
    if (path === undefined) return;
    calculateMidPoint(path);
    calculateBoundingBox(path);
    syncSizePosition();
    pathObserver = new MutationObserver(() => {
        calculateMidPoint(path);
        calculateBoundingBox(path);
    });
    pathObserver.observe(path, {
        attributes: true,
        attributeFilter: ['d'],
    });
});

watch(() => [boundingClientRect.value, inputWidth.value, inputHeight.value], syncSizePosition);

onBeforeUnmount(() => {
    pathObserver?.disconnect();
});

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
    fitRect({
        x: curveMidpoint.value.x - inputWidth.value / 2,
        y: curveMidpoint.value.y - inputHeight.value / 2,
        width: inputWidth.value,
        height: inputHeight.value,
    });
};

// 切换内容类型
const executeToggleType = async () => {
    blurActiveElement();

    await executeAsyncBatch(Symbol('ContentEdge toggle type'), async () => {
        switch (dataTypeOrDefault.value) {
            case 'markdown': {
                updateEdgeData(props.id, {type: 'text', content: markdownEditorValue.value});
                break;
            }
            case 'text': {
                updateEdgeData(props.id, {
                    type: 'markdown',
                    // 和节点一致：沿用切换前内容框的尺寸，最小为 20×24
                    contentSize: {
                        width: Math.max(Content_minWidth, inputWidth.value),
                        height: Math.max(Content_minHeight, inputHeight.value),
                    },
                });
                await nextTick();
                isFocus.value = true;
                break;
            }
        }
    });
};

// 关闭设置：恢复连线输入框焦点，避免焦点落到画布导致 Backspace 误删连线
const executeCloseSettings = async () => {
    isSettingsOpen.value = false;
    await nextTick();
    handleClick();
};

// 删除
const executeDelete = () => {
    if (
        dataTypeOrDefault.value === 'markdown' &&
        markdownEditorValue.value !== props.data.content
    ) {
        updateEdgeData(props.id, {content: markdownEditorValue.value});
    }
    blurActiveElement();
    remove({edges: [props.id]});
};
</script>

<template>
    <g
        class="content-edge"
        :class="{selected: props.selected}"
        @mousedown.capture="handleEdgeMouseDown"
        @touchstart.capture.passive="handleEdgeMouseDown"
    >
        <defs>
            <template
                v-for="end in markerEnds"
                :key="end"
            >
                <marker
                    v-if="arrowShapeOf(end) !== 'none'"
                    :id="`${currentArrowId}-${end}`"
                    viewBox="-10 -10 20 20"
                    refX="0"
                    refY="0"
                    markerWidth="12.5"
                    markerHeight="12.5"
                    markerUnits="strokeWidth"
                    :orient="end === 'start' ? 'auto-start-reverse' : 'auto'"
                >
                    <polyline
                        v-if="arrowShapeOf(end) === 'arrow'"
                        class="content-edge-arrow"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        points="-6,-4 2,0 -6,4"
                    />
                    <polygon
                        v-else-if="arrowShapeOf(end) === 'triangle'"
                        class="content-edge-arrow"
                        points="-6,-5 4,0 -6,5"
                    />
                    <polygon
                        v-else-if="arrowShapeOf(end) === 'diamond'"
                        class="content-edge-arrow"
                        points="-7,0 0,-4.5 7,0 0,4.5"
                    />
                    <circle
                        v-else-if="arrowShapeOf(end) === 'circle'"
                        class="content-edge-arrow"
                        r="4"
                    />
                </marker>
            </template>
        </defs>

        <!-- 曲线和内容区域共同组成输入框的点击热区 -->
        <g @click.capture="handleClick">
            <BaseEdge
                ref="bezierRef"
                v-bind.prop="props"
                class="content-edge-line"
                :style="{strokeWidth: effectiveStrokeWidth}"
                :path="path"
                :marker-start="markerStart"
                :marker-end="markerEnd"
            />

            <AutoResizeForeignObject
                @resize="handleInputResize"
                :style="dataTypeOrDefault === 'markdown' ? {overflow: 'visible'} : undefined"
                :transform="`translate(${curveMidpoint.x - inputWidth / 2} ${curveMidpoint.y - inputHeight / 2})`"
            >
                <!-- text 模式 -->
                <FitSizeBlockInput
                    v-if="dataTypeOrDefault === 'text'"
                    ref="inputRef"
                    v-show="innerValue.length > 0 || isFocus"
                    :class="{untouchable: !isFocus}"
                    :font-size="12"
                    :padding="{top: 2, left: 4, right: 4, bottom: 2}"
                    :style="{borderColor}"
                    v-model="innerValue"
                    :readonly="layer.lock"
                    @blur="handleBlur"
                />
                <!-- markdown 模式 -->
                <div
                    v-else-if="dataTypeOrDefault === 'markdown'"
                    class="edge-markdown-wrapper"
                    :style="markdownWrapperStyle"
                >
                    <MarkdownCompositeEditor
                        v-if="isMarkdownEdit"
                        ref="markdownEditorRef"
                        class="edge-markdown-editor"
                        editor-class="noDrag noWheel"
                        :preview-class="{noDrag: true}"
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
                        class="edge-markdown-preview"
                        :class="{
                            untouchable: !isFocus,
                            fill: hasFixedMarkdownBox,
                        }"
                        :style="{borderColor}"
                        :value="data.content"
                    />

                    <ContentResizeHandles
                        v-if="selected && graphSelection.selectedCount.value === 1 && !layer.lock"
                        :width="markdownSize.width"
                        :height="markdownSize.height"
                        :min-width="Content_minWidth"
                        :min-height="Content_minHeight"
                        @resize="handleMarkdownResize"
                        @resize-end="handleMarkdownResizeEnd"
                    />
                </div>
            </AutoResizeForeignObject>
        </g>

        <AutoResizeForeignObject
            v-if="selected && isFocus"
            @resize="handleToolBarResize"
            style="z-index: var(--edge-toolbar-z-index)"
            :transform="`translate(${curveMidpoint.x - toolBarWidth / (zoom * 2)} ${curveMidpoint.y - inputHeight / 2 - (toolBarHeight + 10) / zoom}) scale(${1 / zoom})`"
        >
            <!-- 阻止工具栏空白处按下时让输入框失焦（按钮自身已阻止） -->
            <div
                class="toolbar"
                @mousedown.prevent
            >
                <button @mousedown.capture.prevent.stop="executeFocus">
                    <IconFocus />
                </button>

                <button
                    @mousedown.capture.prevent.stop="isSettingsOpen = true"
                    v-if="!layer.lock"
                >
                    <IconSettings />
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
            </div>
        </AutoResizeForeignObject>

        <!-- 控制线 - 仅在选中时显示 -->
        <template
            v-if="
                selected &&
                graphSelection.selectedCount.value === 1 &&
                sourceControlPoint &&
                targetControlPoint
            "
        >
            <ControlPointLine
                :start-point="{x: sourceX, y: sourceY}"
                :control-point="sourceControlPoint"
                :layer="layer"
                @control-point-drag-start="sourceControlFixed = true"
                @control-point-drag="(newPos: XYPosition) => (sourceControlPoint = newPos)"
                @control-point-drag-end="handleSourceControlPointDragEnd"
            />
            <ControlPointLine
                :start-point="{x: targetX, y: targetY}"
                :control-point="targetControlPoint"
                :layer="layer"
                @control-point-drag-start="targetControlFixed = true"
                @control-point-drag="(newPos: XYPosition) => (targetControlPoint = newPos)"
                @control-point-drag-end="handleTargetControlPointDragEnd"
            />
        </template>
    </g>

    <!--
        连线组件渲染在 SVG 内部，Teleport 会沿用 SVG 命名空间创建子节点，
        导致弹窗里的 button/input 变成 SVGElement；套一层 foreignObject 切换为 HTML 命名空间
    -->
    <foreignObject
        width="0"
        height="0"
    >
        <Dialog
            v-if="isSettingsOpen"
            :title="translate('edge_settings_title')"
            :onClose="executeCloseSettings"
        >
            <div class="edge-settings">
                <div class="settings-row">
                    <span>{{ translate('edge_source_arrow') }}</span>
                    <CustomSelect
                        :model-value="effectiveSourceArrow"
                        :options="arrowShapeOptions"
                        @update:model-value="onSourceArrowChange"
                    />
                </div>
                <div class="settings-row">
                    <span>{{ translate('edge_target_arrow') }}</span>
                    <CustomSelect
                        :model-value="effectiveTargetArrow"
                        :options="arrowShapeOptions"
                        @update:model-value="onTargetArrowChange"
                    />
                </div>
                <div class="settings-row">
                    <span>{{ translate('edge_stroke_width') }}</span>
                    <input
                        type="range"
                        :min="ContentEdge_strokeWidth_MIN"
                        :max="ContentEdge_strokeWidth_MAX"
                        step="1"
                        :value="effectiveStrokeWidth"
                        @input="onStrokeWidthInput"
                        @change="onStrokeWidthChange"
                    />
                    <span>{{ effectiveStrokeWidth }}</span>
                </div>
                <div class="settings-row">
                    <span>{{ translate('node_markdown') }}</span>
                    <input
                        type="checkbox"
                        :checked="dataTypeOrDefault === 'markdown'"
                        @change="executeToggleType"
                    />
                </div>
            </div>
        </Dialog>
    </foreignObject>
</template>

<style scoped>
.content-edge {
    --edge-color: var(--border-color);
}

.content-edge.selected {
    --edge-color: var(--primary-color);
}

.untouchable {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    pointer-events: none;
}

.toolbar {
    display: flex;
}

.toolbar > button {
    padding: 0.3rem;
    margin-right: 0.3rem;
    transition: background-color 0.3s ease;
}

.toolbar > button:hover {
    background-color: var(--background-color-hover);
}

:deep(.content-edge-line) {
    stroke: var(--edge-color) !important;
    transition: stroke 0.3s ease;
}

.content-edge-arrow {
    fill: var(--edge-color);
    transition: fill 0.3s ease;
}

.edge-settings {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.5rem 0 1rem;
    min-width: 16rem;
}

.edge-settings .settings-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.edge-settings .settings-row > span:first-child {
    flex: 0 0 auto;
    min-width: 5rem;
}

.edge-settings .settings-row input[type='range'] {
    flex: 1 1 auto;
}

:deep(.fit-size-block-input) {
    color: var(--text-color);
    background-color: var(--background-color);
    border: var(--border);
    border-radius: var(--border-radius);
    transition:
        color 0.3s ease,
        background-color 0.3s ease,
        border-color 0.3s ease;
}

.edge-markdown-wrapper {
    position: relative;
    overflow: visible;
}

.edge-markdown-editor {
    width: 100%;
    height: 100%;
}

.edge-markdown-preview {
    color: var(--text-color);
    background-color: var(--background-color);
    border: var(--border);
    border-radius: var(--border-radius);
    padding: 2px 4px;
    transition:
        color 0.3s ease,
        background-color 0.3s ease,
        border-color 0.3s ease;
}

/* 内容框有确定尺寸时，预览填满内容框 */
.edge-markdown-preview.fill {
    width: 100%;
    height: 100%;
}
</style>
