<script setup lang="ts">
import {nextTick, onMounted, ref, useTemplateRef, watch} from "vue";
import {getTextBlockWidth} from "@/components/input/textSize.ts";
import {vTapInput} from "@/components/input/vTabInput.ts";

const isFocus = ref(false)

const props = withDefaults(
    defineProps<{
        padding?: number,
        borderWidth?: number,
        fontSize?: number,
    }>(), {
        padding: 8,
        borderWidth: 1,
        fontSize: 16,
    }
)

const modelValue = defineModel<string>({
    required: true,
})

const textareaRef = useTemplateRef<HTMLTextAreaElement>("textareaRef")
const innerValue = ref<string>(modelValue.value)

const width = ref(0)
const height = ref(0)

const emits = defineEmits<{
    (event: "resize", size: {width: number, height: number}): void
}>()

const updateTextSize = () => {
    if (!textareaRef.value) return
    const expanding = (props.borderWidth + props.padding) * 2
    const {width: innerWidth, height: innerHeight} = getTextBlockWidth(innerValue.value, textareaRef.value)
    width.value = (innerWidth <= 0 ? 1 : innerWidth) + expanding
    height.value = (innerHeight < props.fontSize ? props.fontSize : innerHeight) + expanding
    emits("resize", {width: width.value, height: height.value})
}

const handleComposition = (e: CompositionEvent) => {
    if (!textareaRef.value) return
    const start = textareaRef.value.selectionStart ?? innerValue.value.length
    const text = innerValue.value.slice(0, start) + e.data + innerValue.value.slice(start)
    const expanding = (props.borderWidth + props.padding) * 2
    const {width: innerWidth, height: innerHeight} = getTextBlockWidth(text, textareaRef.value)
    width.value = (innerWidth <= 0 ? 1 : innerWidth) + expanding
    height.value = (innerHeight < props.fontSize ? props.fontSize : innerHeight) + expanding
    emits("resize", {width: width.value, height: height.value})
}

onMounted(() => {
    nextTick(() => {
        updateTextSize()
    })
})

watch(() => innerValue.value, () => {
    nextTick(() => {
        updateTextSize()
    })
})

watch(() => modelValue.value, (newVal) => {
    innerValue.value = newVal
})

const handleFocus = () => {
    if (isFocus.value) return
    isFocus.value = true
}

const handleChange = () => {
    if (!textareaRef.value) return
    modelValue.value = innerValue.value
}

const handleBlur = () => {
    if (innerValue.value !== modelValue.value) {
        innerValue.value = modelValue.value
    }
    isFocus.value = false
}

defineExpose({el: textareaRef, isFocus})
</script>

<template>
    <textarea
        ref="textareaRef"
        :style="{
            padding: `${padding}px`,
            borderWidth: `${borderWidth}px`,
            fontSize: `${fontSize}px`,
            width: `${width}px`,
            height: `${height}px`,
            cursor: isFocus ? 'text' : 'default'
        }"
        v-model="innerValue"
        @focus="handleFocus"
        @change="handleChange"
        @blur="handleBlur"
        v-tap-input

        @compositionstart="updateTextSize"
        @compositionupdate="handleComposition"
        @compositionend="updateTextSize"
    />
</template>

<style scoped>
textarea {
    color: var(--text-color);
    background-color: var(--background-color);
    border: var(--border);
    border-radius: var(--border-radius);

    vertical-align: top;
    outline: none;

    resize: none;
    white-space: pre;
    word-wrap: normal;
    word-break: keep-all;
    overflow: hidden;
    overflow-wrap: normal;
    tab-size: 4;

    transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}
</style>
