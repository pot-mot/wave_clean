<script setup lang="ts">
import {nextTick, ref, useTemplateRef, watch} from "vue";
import {getTextLineSize} from "@/utils/textSize.ts";

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

const inputRef = useTemplateRef<HTMLInputElement>("inputRef")
const innerValue = ref<string>('')

const width = ref(0)
const height = ref(0)

const emits = defineEmits<{
    (event: "resize", size: {width: number, height: number}): void
}>()

const updateTextSize = () => {
    if (!inputRef.value) return;
    const textSize = getTextLineSize(innerValue.value, inputRef.value)

    const expanding = (props.borderWidth + props.padding) * 2
    width.value = textSize.width <= 0 ? 1 + expanding : textSize.width + expanding
    height.value = textSize.height < props.fontSize ? props.fontSize + expanding : textSize.height + expanding
    emits("resize", {width: width.value, height: height.value})
}

watch(() => modelValue.value, (newVal) => {
    nextTick(() => {
        innerValue.value = newVal
        updateTextSize()
    })
}, {immediate: true})

watch(() => innerValue.value, (newVal, oldVal) => {
    if (oldVal !== undefined && oldVal.length === 0) {
        nextTick(() => {
            if (!inputRef.value) return
            inputRef.value.setSelectionRange(newVal.length, newVal.length)
        })
    }
    nextTick(() => {
        updateTextSize()
    })
})

// 阻止 handleBlur 发生
let emitBlur = true

const handleChange = async () => {
    if (!inputRef.value) return
    modelValue.value = innerValue.value

    emitBlur = false
    inputRef.value.blur()
    isEdit.value = false
}

const handleBlur = () => {
    if (!emitBlur) {
        emitBlur = true
        return
    }
    if (!inputRef.value) return
    innerValue.value = modelValue.value
    isEdit.value = false
}

defineExpose({el: inputRef})
</script>

<template>
    <input
        ref="inputRef"
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
        @keydown.enter="handleChange"
        @blur="handleBlur"
        @focus="isEdit = true"
    />
</template>
