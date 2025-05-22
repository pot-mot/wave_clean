<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef} from "vue";
import {BezierEdge, EdgeProps} from "@vue-flow/core";
import {ContentEdgeData, useMindMap} from "@/mindMap/useMindMap.ts";
import FitSizeBlockInput from "@/input/FitSizeBlockInput.vue";
import {useEdgeUpdaterTouch} from "@/mindMap/touchToMouse/useEdgeUpdaterTouch.ts";
import AutoResizeForeignObject from "@/mindMap/svg/AutoResizeForeignObject.vue";
import IconDelete from "@/icons/IconDelete.vue";

const {updateEdgeData, isMultiSelected, canMultiSelect, selectEdge, remove, currentViewport} = useMindMap()

const props = defineProps<EdgeProps & {
    id: string,
    data: ContentEdgeData,
}>()

const handleDelete = () => {
    remove({edges: [props.id]})
}

useEdgeUpdaterTouch(props.id)

const innerValue = computed<string>({
    get() {
        return props.data.content
    },
    set(newVal) {
        updateEdgeData(props.id, {content: newVal})
    }
})

const zoom = computed(() => {
    return  currentViewport.value !== undefined ? 1 / currentViewport.value.zoom : 1
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

const bezierRef = useTemplateRef<InstanceType<typeof BezierEdge>>("bezierRef");
let pathObserver: MutationObserver | undefined = undefined

const curveMidpoint = ref<{ x: number; y: number }>({ x: 0, y: 0 });

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
    if (isMultiSelected.value) return
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
</script>

<template>
    <g
        class="content-edge"
        @mousedown.capture="handleEdgeMouseDown"
        @touchstart.capture="handleEdgeMouseDown"
        @click.capture="handleClick"
    >
        <BezierEdge ref="bezierRef" v-bind.prop="props" :style="{stroke: selected ? 'var(--primary-color)' : undefined}"/>

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
            :transform="`translate(${curveMidpoint.x - (toolBarWidth * zoom) / 2} ${curveMidpoint.y - inputHeight / 2 - (toolBarHeight * zoom)}) scale(${zoom})`"
        >
            <div style="padding-bottom: 0.3rem;">
                <button @mousedown.capture="handleDelete" style="padding: 0.3rem;">
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
</style>
