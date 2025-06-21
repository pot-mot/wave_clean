<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch} from "vue";
import {BaseEdge, EdgeProps} from "@vue-flow/core";
import {ContentEdgeData, RawMindMapLayer, SizePositionEdgePartial, useMindMap} from "@/mindMap/useMindMap.ts";
import FitSizeBlockInput from "@/components/input/FitSizeBlockInput.vue";
import {useEdgeUpdaterTouch} from "@/mindMap/edge/useEdgeUpdaterTouch.ts";
import AutoResizeForeignObject from "@/mindMap/svg/AutoResizeForeignObject.vue";
import IconDelete from "@/components/icons/IconDelete.vue";
import IconFocus from "@/components/icons/IconFocus.vue";
import {blurActiveElement} from "@/mindMap/clickUtils.ts";
import IconArrowNone from "@/components/icons/IconArrowNone.vue";
import IconArrowTwoWay from "@/components/icons/IconArrowTwoWay.vue";
import {getPaddingBezierPath} from "@/mindMap/edge/paddingBezierPath.ts";
import IconArrowOneWayLeft from "@/components/icons/IconArrowOneWayLeft.vue";
import IconArrowOneWayRight from "@/components/icons/IconArrowOneWayRight.vue";
import {v7 as uuid} from "uuid"
import {debounce, throttle} from "lodash";

const {updateEdgeData, isSelectionPlural, canMultiSelect, findEdge, selectEdge, fitRect, remove, currentViewport} = useMindMap()

const props = defineProps<EdgeProps & {
    id: string,
    data: ContentEdgeData,
    layer: RawMindMapLayer,
}>()

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
const zoom = computed(() => {
    return currentViewport.value !== undefined ? 1 / currentViewport.value.zoom : 1
})

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

watch(() => [boundingClientRect.value, inputWidth.value, inputHeight.value], debounce(() => {
    const edge = findEdge(props.id, props.layer.vueFlow)
    if (edge !== undefined && boundingClientRect.value !== undefined) {
        let {width, height, top, left} = boundingClientRect.value
        if (inputWidth.value > width) {
            left -= (inputWidth.value - width) / 2
            width = inputWidth.value
        }
        if (inputHeight.value > height) {
            top -= (inputHeight.value - height) / 2
            height = inputHeight.value
        }

        const {
            x: flowLeft,
            y: flowTop,
        } = props.layer.vueFlow.screenToFlowCoordinate({
            x: left,
            y: top,
        })
        const sizePositionData: SizePositionEdgePartial["data"] = {
            position: {left: flowLeft, top: flowTop},
            size: {width, height}
        }

        // edge size position change never emit history change
        Object.assign(edge.data, sizePositionData)
    }
}, 500), {immediate: true})

// 计算 edge 外部尺寸
const calculateBoundingBox = throttle((path: SVGPathElement) => {
    boundingClientRect.value = path.getBoundingClientRect()
}, 500)

onMounted(() => {
    const path = bezierRef.value?.$el?.nextElementSibling as SVGPathElement | undefined
    if (path === undefined) return
    calculateMidPoint(path)
    calculateBoundingBox(path)
    pathObserver = new MutationObserver(() => {
        calculateMidPoint(path)
        calculateBoundingBox(path)
    })
    pathObserver.observe(path, {
        attributes: true,
        attributeFilter: ['d']
    })

    curveMidpoint.value = path.getPointAtLength(path.getTotalLength() / 2)
})

onBeforeUnmount(() => {
    pathObserver?.disconnect()
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
        @touchstart.capture="handleEdgeMouseDown"
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
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    points="-6,-4 2,0 -6,4"
                    style="fill: var(--edge-color); transition: fill 0.5s ease;"
                />
            </marker>
        </defs>

        <BaseEdge
            ref="bezierRef"
            v-bind.prop="props"
            style="stroke: var(--edge-color); transition: stroke 0.5s ease;"
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
                :padding="2"
                :style="{
                    borderColor: selected ? 'var(--primary-color)' : 'transparent',
                }"
                v-model="innerValue"
                @blur="handleBlur"
            />
        </AutoResizeForeignObject>

        <AutoResizeForeignObject
            v-if="selected && inputShow"
            @resize="handleToolBarResize"
            style="z-index: var(--top-z-index);"
            :transform="`translate(${curveMidpoint.x - (toolBarWidth * zoom) / 2} ${curveMidpoint.y - inputHeight / 2 - (toolBarHeight + 10) * zoom}) scale(${zoom})`"
        >
            <div class="toolbar">
                <button @mousedown.capture.prevent.stop="executeFocus">
                    <IconFocus/>
                </button>

                <button @mousedown.capture.prevent.stop="executeToggleArrowType">
                    <template v-if="data.arrowType === 'one-way'">
                        <IconArrowOneWayLeft v-if="sourceX < targetX"/>
                        <IconArrowOneWayRight v-else/>
                    </template>
                    <IconArrowTwoWay v-else-if="data.arrowType === 'two-way'"/>
                    <IconArrowNone v-else/>
                </button>

                <button @mousedown.capture.prevent.stop="executeDelete">
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
    transition: background-color 0.5s ease;
}

.toolbar > button:hover {
    background-color: var(--background-color-hover);
}
</style>
