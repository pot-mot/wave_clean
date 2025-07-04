<script setup lang="ts">
import {Theme} from "@tauri-apps/api/window";
import {computed, onBeforeUnmount, onMounted, useTemplateRef, watch} from "vue";
import {MarkdownEditorElement} from "@/components/markdown/MarkdownEditorElement.ts";
import Vditor from "vditor";
import {v7 as uuid} from "uuid"
import {sendMessage} from "@/components/message/sendMessage.ts";

const id = `markdown-editor-${uuid()}`

const modelValue = defineModel<string>({
    required: true
})

const props = withDefaults(defineProps<{
    theme?: Theme | undefined,
    previewOnly?: boolean,
}>(), {
    previewOnly: false,
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

const editorTheme = computed(() => {
    return props.theme === "dark" ? "dark" : "classic"
})

onMounted(async () => {
    const element = elementRef.value
    if (!element) {
        sendMessage("MarkdownEditor init fail, element not existed", {type: "error"})
        return
    }
    const editor = new Vditor(element, {
        mode: "sv",
        height: "100%",
        width: "100%",
        theme: editorTheme.value,
        cache: {
            enable: false,
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
})

onBeforeUnmount(() => {
    editorRef.value = null
})

watch(() => modelValue.value, (value) => {
    if (editorRef.value?.getValue() !== value) {
        editorRef.value?.setValue(value)
    }
})

watch(() => editorTheme.value, (value) => {
    editorRef.value?.setTheme(value)
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