<script setup lang="ts">
import {Theme} from "@tauri-apps/api/window";
import {computed, nextTick, onBeforeUnmount, onMounted, useTemplateRef} from "vue";
import {MarkdownEditorElement} from "@/components/markdown/MarkdownEditorElement.ts";
import Vditor from "vditor";
import {v7 as uuid} from "uuid"

const id = `markdown-editor-${uuid()}`

const modelValue = defineModel<string>({
    required: true
})

withDefaults(defineProps<{
    theme?: Theme | undefined,
    previewOnly?: boolean,

    fontSize?: number,
}>(), {
    previewOnly: false,

    fontSize: 16,
})

const emits = defineEmits<{
    (event: "input", editor: Vditor, value: string): void
    (event: "focus", editor: Vditor): void
    (event: "blur", editor: Vditor): void
}>()

const elementRef = useTemplateRef<MarkdownEditorElement>('elementRef')
const editorRef = computed<Vditor | null | undefined>({
    get() {
        return elementRef.value?.editor
    },
    set(newEditor: Vditor | null | undefined) {
        if (elementRef.value) {
            elementRef.value.editor = newEditor
        }
    }
})

onMounted(async () => {
    await nextTick()
    const element = elementRef.value
    if (element) {
        const editor = new Vditor(element, {
            mode: "ir",
            height: "100%",
            width: "100%",
            cache: {
                enable: false, // 是否使用 localStorage 进行缓存
            },
            preview: {
                mode: "editor",
            },
            after:() => {
                editor.setValue(modelValue.value)
            },
            toolbar: [],
            input: (value: string) => {
                emits("input", editor, value)
                modelValue.value = value
            },
            focus: () => {
                emits("focus", editor)
            },
            blur: () => {
                emits("blur", editor)
            }
        })
        editorRef.value = editor
    }
})

onBeforeUnmount(() => {
    editorRef.value = null
})

defineExpose({
    elementRef,
    editorRef,
})
</script>

<template>
    <div
        class="markdown-editor-wrapper"
    >
        <div
            :id="id"
            class="markdown-editor"
            ref="elementRef"
        />
    </div>
</template>

<style scoped>
.markdown-editor-wrapper {
    width: 100%;
    height: 100%;
}
</style>