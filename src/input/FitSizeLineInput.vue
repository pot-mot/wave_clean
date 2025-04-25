<script setup lang="ts">
import {nextTick, onMounted, ref, useTemplateRef, watch} from "vue";
import {getTextLineSize} from "@/input/textSize.ts";

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

const inputRef = useTemplateRef<HTMLInputElement>("inputRef")
const innerValue = ref<string>(modelValue.value)

const width = ref(0)
const height = ref(0)

const emits = defineEmits<{
    (event: "resize", size: {width: number, height: number}): void
}>()

const updateTextSize = () => {
    if (!inputRef.value) return;
    const expanding = (props.borderWidth + props.padding) * 2
    const {width: innerWidth, height: innerHeight} = getTextLineSize(innerValue.value, inputRef.value)
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
    if (!inputRef.value) return
    modelValue.value = innerValue.value
}

const handleEnterKeyDown = () => {
    if (!inputRef.value) return
    modelValue.value = innerValue.value
    inputRef.value.blur()
}

const handleBlur = () => {
    if (innerValue.value !== modelValue.value) {
        innerValue.value = modelValue.value
    }
    isFocus.value = false
}

defineExpose({el: inputRef, isFocus})
</script>

<template>
    <input
        ref="inputRef"
        :style="{
            color: 'var(--text-color)',
            backgroundColor: 'var(--background-color)',
            border: 'var(--border)',
            borderRadius: 'var(--border-radius)',

            verticalAlign: 'top',
            outline: 'none',
            padding: `${props.padding}px`,
            borderWidth: `${props.borderWidth}px`,
            fontSize: `${props.fontSize}px`,
            width: `${width}px`,
            height: `${height}px`,
            cursor: isFocus ? 'text' : 'default'
        }"
        v-model="innerValue"
        @focus="handleFocus"
        @change="handleChange"
        @keydown.enter="handleEnterKeyDown"
        @blur="handleBlur"
    />
</template>
