<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef} from "vue";
import {BezierEdge, EdgeProps} from "@vue-flow/core";
import {ContentEdgeData, useMindMap} from "@/mindMap/useMindMap.ts";
import FitSizeBlockInput from "@/input/FitSizeBlockInput.vue";

const {updateEdgeData, isMultiSelected, canMultiSelect, selectEdge} = useMindMap()

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

const inputWidth = ref(0)
const inputHeight = ref(0)

const handleResize = (size: { width: number, height: number }) => {
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
        <g :transform="`translate(${curveMidpoint.x - inputWidth / 2} ${curveMidpoint.y - inputHeight / 2})`">
            <foreignObject x="0" y="0" :width="inputWidth" :height="inputHeight">
                <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%;">
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
                        @resize="handleResize"
                        @blur="handleBlur"
                    />
                </div>
            </foreignObject>
        </g>
    </g>
</template>

<style scoped>
.untouchable {
    user-select: none;
    pointer-events: none;
}
</style>
