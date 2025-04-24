<script setup lang="ts">
import {nextTick, onMounted, ref, useTemplateRef, watch} from "vue";
import {getTextBlockWidth} from "@/input/textSize.ts";

const isEdit = ref(false)

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
    const innerWidth = getTextBlockWidth(innerValue.value, textareaRef.value)
    const innerHeight = textareaRef.value.scrollHeight - expanding
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

const handleKeyDown = (e: KeyboardEvent) => {
    console.log(e)
    if (e.key === 'Tab') {
    }
}

const handleFocus = () => {
    isEdit.value = true
}

const handleChange = () => {
    if (!textareaRef.value) return
    modelValue.value = innerValue.value

    textareaRef.value.blur()
}

const handleBlur = () => {
    if (innerValue.value !== modelValue.value) {
        innerValue.value = modelValue.value
    }
    isEdit.value = false
}

defineExpose({el: textareaRef})
</script>

<template>
    <textarea
        ref="textareaRef"
        :style="{
            verticalAlign: 'top',
            outlineOffset: '2px',
            padding: `${props.padding}px`,
            borderWidth: `${props.borderWidth}px`,
            fontSize: `${props.fontSize}px`,
            width: `${width}px`,
            height: `${height}px`,
            borderColor: isEdit ? '#000' : 'transparent',
            backgroundColor: isEdit ? '#fff' : 'transparent'
        }"
        v-model="innerValue"
        @keydown="handleKeyDown"
        @focus="handleFocus"
        @change="handleChange"
        @blur="handleBlur"
    />
</template>

<style scoped>
textarea {
    resize: none;
    white-space: pre;
    word-wrap: normal;
    word-break: keep-all;
    overflow: hidden;
    overflow-wrap: normal;
    background-color: transparent;
    font: inherit;
    tab-size: 4;
}
</style>
