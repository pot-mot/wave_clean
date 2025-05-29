<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef} from "vue";
import {BaseEdge, BezierEdge, EdgeProps} from "@vue-flow/core";
import {ContentEdgeData, useMindMap} from "@/mindMap/useMindMap.ts";
import FitSizeBlockInput from "@/input/FitSizeBlockInput.vue";
import {useEdgeUpdaterTouch} from "@/mindMap/touchToMouse/useEdgeUpdaterTouch.ts";
import AutoResizeForeignObject from "@/mindMap/svg/AutoResizeForeignObject.vue";
import IconDelete from "@/icons/IconDelete.vue";
import IconFocus from "@/icons/IconFocus.vue";
import {blurActiveElement} from "@/mindMap/clickUtils.ts";
import IconArrowNone from "@/icons/IconArrowNone.vue";
import IconArrowTwoWay from "@/icons/IconArrowTwoWay.vue";
import {getPaddingBezierPath} from "@/mindMap/edge/paddingBezierPath.ts";
import IconArrowOneWayLeft from "@/icons/IconArrowOneWayLeft.vue";
import IconArrowOneWayRight from "@/icons/IconArrowOneWayRight.vue";

const {updateEdgeData, isSelectionPlural, canMultiSelect, selectEdge, fitRect, remove, currentViewport} = useMindMap()

const props = defineProps<EdgeProps & {
    id: string,
    data: ContentEdgeData,
}>()

const innerValue = computed<string>({
    get() {
        return props.data.content
    },
    set(newVal) {
        updateEdgeData(props.id, {content: newVal})
    }
})

const zoom = computed(() => {
    return currentViewport.value !== undefined ? 1 / currentViewport.value.zoom : 1
})

const toolBarWidth = ref(0)
const toolBarHeight = ref(0)

const handleToolBarResize = (size: { width: number, height: number }) => {
    toolBarWidth.value = size.width
    toolBarHeight.value = size.height
}

const inputWidth = ref(0)
const inputHeight = ref(0)

const handleInputResize = (size: { width: number, height: number }) => {
    inputWidth.value = size.width
    inputHeight.value = size.height
}

const inputShow = ref(false)
const inputRef = useTemplateRef<InstanceType<typeof FitSizeBlockInput>>("inputRef")

useEdgeUpdaterTouch(props.id)

// 贝塞尔曲线 path
const bezierPath = computed(() => {
    return getPaddingBezierPath(props)
})

// 两头的 marker 样式
const markerStart = computed<string | undefined>(() => {
    return props.data.arrowType === 'two-way' ? `url(#arrow${props.id})` : undefined
})
const markerEnd = computed<string | undefined>(() => {
    return props.data.arrowType === 'two-way' || props.data.arrowType === 'one-way' ? `url(#arrow${props.id})` : undefined
})

// 贝塞尔曲线中点控制 input 位置
const bezierRef = useTemplateRef<InstanceType<typeof BezierEdge>>("bezierRef")
const curveMidpoint = ref<{ x: number; y: number }>({x: 0, y: 0});

// 监听 svg 路径变化
let pathObserver: MutationObserver | undefined = undefined

onMounted(() => {
    const path = bezierRef.value?.$el?.nextElementSibling as SVGPathElement | undefined
    if (path === undefined) return
    pathObserver = new MutationObserver(() => {
        curveMidpoint.value = path.getPointAtLength(path.getTotalLength() / 2)
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

const handleEdgeMouseDown = () => {
    if (isSelectionPlural.value) return
    if (canMultiSelect.value) return
    selectEdge(props.id)
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

// 聚焦
const handleFocus = () => {
    fitRect({
        x: curveMidpoint.value.x - inputWidth.value / 2,
        y: curveMidpoint.value.y - inputHeight.value / 2,
        width: inputWidth.value,
        height: inputHeight.value,
    })
}

// 切换箭头类型
const handleToggleArrowType = () => {
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
const handleDelete = () => {
    blurActiveElement()
    remove({edges: [props.id]})
}
</script>

<template>
    <g
        class="content-edge"
        @mousedown.capture="handleEdgeMouseDown"
        @touchstart.capture="handleEdgeMouseDown"
        @click.capture="handleClick"
    >
        <defs>
            <marker
                :id="`arrow${props.id}`"
                viewBox="-10 -10 20 20" refX="0" refY="0"
                markerWidth="12.5" markerHeight="12.5" markerUnits="strokeWidth"
                orient="auto-start-reverse"
            >
                <polyline
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    points="-6,-4 2,0 -6,4"
                    style="transition: fill 0.5s ease;"
                    :style="{
                        fill: selected ? 'var(--primary-color)' : 'var(--border-color)'
                    }"
                />
            </marker>
        </defs>

        <BaseEdge
            ref="bezierRef"
            v-bind.prop="props"
            style="transition: stroke 0.5s ease;"
            :style="{stroke: selected ? 'var(--primary-color)' : 'var(--border-color)'}"
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
                <button @mousedown.capture.prevent.stop="handleFocus">
                    <IconFocus/>
                </button>

                <button @mousedown.capture.prevent.stop="handleToggleArrowType">
                    <template v-if="data.arrowType === 'one-way'">
                        <IconArrowOneWayLeft v-if="sourceX < targetX"/>
                        <IconArrowOneWayRight v-else/>
                    </template>
                    <IconArrowTwoWay v-else-if="data.arrowType === 'two-way'"/>
                    <IconArrowNone v-else/>
                </button>

                <button @mousedown.capture.prevent.stop="handleDelete">
                    <IconDelete/>
                </button>
            </div>
        </AutoResizeForeignObject>
    </g>
</template>

<style scoped>
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

.toolbar > button svg {
    /* 阻止点击按钮导致外部无法拖拽问题 */
    pointer-events: none !important;
}

.toolbar > button:hover {
    background-color: var(--background-color-hover);
}
</style>
