<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch} from "vue";
import {BaseEdge, type EdgeProps} from "@vue-flow/core";
import {useMindMap} from "@/mindMap/useMindMap.ts";
import FitSizeBlockInput from "@/components/input/FitSizeBlockInput.vue";
import {useEdgeUpdaterTouch} from "@/mindMap/edge/useEdgeUpdaterTouch.ts";
import AutoResizeForeignObject from "@/mindMap/svg/AutoResizeForeignObject.vue";
import IconDelete from "@/components/icons/IconDelete.vue";
import IconFocus from "@/components/icons/IconFocus.vue";
import {blurActiveElement} from "@/utils/event/judgeEventTarget.ts";
import IconArrowNone from "@/components/icons/IconArrowNone.vue";
import IconArrowTwoWay from "@/components/icons/IconArrowTwoWay.vue";
import {getPaddingBezierPath} from "@/mindMap/edge/paddingBezierPath.ts";
import IconArrowOneWayLeft from "@/components/icons/IconArrowOneWayLeft.vue";
import IconArrowOneWayRight from "@/components/icons/IconArrowOneWayRight.vue";
import {v7 as uuid} from "uuid"
import {type RawMindMapLayer} from "@/mindMap/layer/MindMapLayer.ts";
import {type SizePositionEdgePartial} from "@/mindMap/edge/SizePositionEdge.ts";
import {type ContentEdgeData} from "@/mindMap/edge/ContentEdge.ts";

const {updateEdgeData, isSelectionPlural, canMultiSelect, findEdge, selectEdge, fitRect, remove, zoom} = useMindMap()

const props = defineProps<EdgeProps<ContentEdgeData> & {
    layer: RawMindMapLayer,
}>()

const _edge = computed(() => findEdge(props.id, props.layer.vueFlow))

const innerValue = computed<string>({
    get() {
        return props.data.content
    },
    set(newVal) {
        updateEdgeData(props.id, {content: newVal})
    }
})

const inputWidth = ref(0)
const inputHeight = ref(0)

const handleInputResize = (size: { width: number, height: number }) => {
    inputWidth.value = size.width
    inputHeight.value = size.height
}

const inputShow = ref(false)
const inputRef = useTemplateRef<InstanceType<typeof FitSizeBlockInput>>("inputRef")

const handleEdgeMouseDown = () => {
    if (isSelectionPlural.value) return
    if (canMultiSelect.value) return
    selectEdge(props.id, props.layer.vueFlow)
}

const handleClick = () => {
    if (canMultiSelect.value) return
    if (!props.selected) return
    inputShow.value = true
    nextTick(() => {
        inputRef.value?.el?.focus()
    })
}

const handleBlur = () => {
    inputShow.value = false
}

// 工具栏
const toolBarWidth = ref(0)
const toolBarHeight = ref(0)

const handleToolBarResize = (size: { width: number, height: number }) => {
    toolBarWidth.value = size.width
    toolBarHeight.value = size.height
}

useEdgeUpdaterTouch(props.id)

// 贝塞尔曲线 path
const bezierPath = computed(() => {
    return getPaddingBezierPath(props)
})

// 两头的 marker 样式
const currentArrowId = uuid()

const markerStart = computed<string | undefined>(() => {
    return props.data.arrowType === 'two-way' ? `url(#arrow-${currentArrowId})` : undefined
})
const markerEnd = computed<string | undefined>(() => {
    return props.data.arrowType === 'two-way' || props.data.arrowType === 'one-way' ? `url(#arrow-${currentArrowId})` : undefined
})

// 贝塞尔曲线中点控制 input 位置
const bezierRef = useTemplateRef<InstanceType<typeof BaseEdge>>("bezierRef")
const curveMidpoint = ref<{ x: number; y: number }>({x: 0, y: 0});

// 监听 svg 路径变化
let pathObserver: MutationObserver | undefined = undefined

// 计算贝塞尔曲线中点
const calculateMidPoint = (path: SVGPathElement) => {
    curveMidpoint.value = path.getPointAtLength(path.getTotalLength() / 2)
}

// 同步 edge size position
const boundingClientRect = ref<DOMRect>()

// 计算 edge 外部尺寸
const calculateBoundingBox = (path: SVGPathElement) => {
    boundingClientRect.value = path.getBoundingClientRect()
}

const syncSizePosition = () => {
    const edge = _edge.value
    if (edge !== undefined && boundingClientRect.value !== undefined) {
        const flowTransform = props.layer.vueFlow.viewport.value
        const zoom = flowTransform.zoom

        let {width, height, x: left, y: top} = boundingClientRect.value

        // 计算与当前画布的偏移量
        left -= flowTransform.x
        top -= flowTransform.y

        // 计算缩放
        left /= zoom
        top /= zoom
        width /= zoom
        height /= zoom

        if (inputWidth.value > width) {
            left -= (inputWidth.value - width) / 2
            width = inputWidth.value
        }
        if (inputHeight.value > height) {
            top -= (inputHeight.value - height) / 2
            height = inputHeight.value
        }

        const sizePositionData: SizePositionEdgePartial["data"] = {
            position: {left, top},
            size: {width: width, height: height}
        }

        // edge size position change never emit history change
        Object.assign(edge.data, sizePositionData)
    }
}

onMounted(() => {
    const path = bezierRef.value?.$el?.nextElementSibling as SVGPathElement | undefined
    if (path === undefined) return
    calculateMidPoint(path)
    calculateBoundingBox(path)
    syncSizePosition()
    pathObserver = new MutationObserver(() => {
        calculateMidPoint(path)
        calculateBoundingBox(path)
    })
    pathObserver.observe(path, {
        attributes: true,
        attributeFilter: ['d']
    })
})

watch(() => [boundingClientRect.value, inputWidth.value, inputHeight.value], syncSizePosition)

onBeforeUnmount(() => {
    pathObserver?.disconnect()
})

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
    fitRect({
        x: curveMidpoint.value.x - inputWidth.value / 2,
        y: curveMidpoint.value.y - inputHeight.value / 2,
        width: inputWidth.value,
        height: inputHeight.value,
    })
}

// 切换箭头类型
const executeToggleArrowType = () => {
    switch (props.data.arrowType) {
        case 'one-way':
            updateEdgeData(props.id, {arrowType: 'two-way'})
            break
        case 'two-way':
            updateEdgeData(props.id, {arrowType: 'none'})
            break
        default:
            updateEdgeData(props.id, {arrowType: 'one-way'})
            break
    }
}

// 删除
const executeDelete = () => {
    blurActiveElement()
    remove({edges: [props.id]})
}
</script>

<template>
    <g
        class="content-edge"
        :class="{selected: props.selected}"
        @mousedown.capture="handleEdgeMouseDown"
        @touchstart.capture.passive="handleEdgeMouseDown"
        @click.capture="handleClick"
    >
        <defs>
            <marker
                :id="`arrow-${currentArrowId}`"
                viewBox="-10 -10 20 20" refX="0" refY="0"
                markerWidth="12.5" markerHeight="12.5" markerUnits="strokeWidth"
                orient="auto-start-reverse"
            >
                <polyline
                    class="content-edge-arrow"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    points="-6,-4 2,0 -6,4"
                />
            </marker>
        </defs>

        <BaseEdge
            ref="bezierRef"
            v-bind.prop="props"
            class="content-edge-line"
            :path="bezierPath"
            :marker-start="markerStart"
            :marker-end="markerEnd"
        />

        <AutoResizeForeignObject
            @resize="handleInputResize"
            :transform="`translate(${curveMidpoint.x - inputWidth / 2} ${curveMidpoint.y - inputHeight / 2})`"
        >
            <FitSizeBlockInput
                ref="inputRef"
                v-show="innerValue.length > 0 || inputShow"
                :class="{untouchable: !inputShow}"
                :font-size="12"
                :padding="{top: 2, left: 4, right: 4, bottom: 2}"
                :style="{borderColor}"
                v-model="innerValue"
                :readonly="layer.lock"
                @blur="handleBlur"
            />
        </AutoResizeForeignObject>

        <AutoResizeForeignObject
            v-if="selected && inputShow"
            @resize="handleToolBarResize"
            style="z-index: var(--edge-toolbar-z-index);"
            :transform="`translate(${curveMidpoint.x - toolBarWidth / (zoom * 2)} ${curveMidpoint.y - inputHeight / 2 - (toolBarHeight + 10) / zoom}) scale(${1 / zoom})`"
        >
            <div class="toolbar">
                <button @mousedown.capture.prevent.stop="executeFocus">
                    <IconFocus/>
                </button>

                <button @mousedown.capture.prevent.stop="executeToggleArrowType" v-if="!layer.lock">
                    <template v-if="data.arrowType === 'one-way'">
                        <IconArrowOneWayLeft v-if="sourceX < targetX"/>
                        <IconArrowOneWayRight v-else/>
                    </template>
                    <IconArrowTwoWay v-else-if="data.arrowType === 'two-way'"/>
                    <IconArrowNone v-else/>
                </button>

                <button @mousedown.capture.prevent.stop="executeDelete" v-if="!layer.lock">
                    <IconDelete/>
                </button>
            </div>
        </AutoResizeForeignObject>
    </g>
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

:deep(.fit-size-block-input) {
    color: var(--text-color);
    background-color: var(--background-color);
    border: var(--border);
    border-radius: var(--border-radius);
    transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}
</style>
