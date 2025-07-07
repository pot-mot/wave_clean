<script setup lang="ts">
import {Theme} from "@tauri-apps/api/window";
import {computed, onBeforeUnmount, onMounted, useTemplateRef, watch} from "vue";
import {v7 as uuid} from "uuid"
import {sendMessage} from "@/components/message/sendMessage.ts";
import {editor} from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/editor/common/editorTheme.js"
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import {MarkdownEditorElement} from "@/components/markdown/editor/MarkdownEditorElement.ts";
import {initMonacoMarkdownEvent} from "@/components/markdown/editor/markdownCompletion.ts";

const id = `markdown-editor-${uuid()}`

const modelValue = defineModel<string>({
    required: true
})

const props = defineProps<{
    theme?: Theme | undefined,
}>()

const emits = defineEmits<{
    (event: "change", editor: IStandaloneCodeEditor, value: string): void
    (event: "focus", editor: IStandaloneCodeEditor): void
    (event: "blur", editor: IStandaloneCodeEditor): void
}>()

const elementRef = useTemplateRef<MarkdownEditorElement>('elementRef')
const editorRef = computed<IStandaloneCodeEditor | null | undefined>({
    get() {
        return elementRef.value?.editor
    },
    set(newEditor: IStandaloneCodeEditor | null | undefined) {
        if (elementRef.value) {
            elementRef.value.editor = newEditor
        }
    }
})

const editorTheme = computed(() => {
    return props.theme === "dark" ? "vs-dark" : "vs"
})

onMounted(async () => {
    const element = elementRef.value
    if (!element) {
        sendMessage("MarkdownEditor init fail, element not existed", {type: "error"})
        return
    }
    const editorInstance = editor.create(element, {
        language: "markdown",
        value: modelValue.value,
        theme: editorTheme.value,
        selectOnLineNumbers: false, // 显示行号 默认true
        minimap: {
            enabled: false,
        },
        lineNumbers: "off",
        readOnly: false, // 只读
        fontSize: 16, // 字体大小
        lineHeight: 24,
        padding: {top: 12, bottom: 12},
        tabSize: 4,
        folding: true,
        wordWrap: "on",
        wordBreak: "keepAll",
        wrappingIndent: "none",
        scrollBeyondLastLine: true, // 代码后面的空白
        overviewRulerBorder: false, // 不要滚动条的边框
        dragAndDrop: false,
        automaticLayout: true,
    })

    initMonacoMarkdownEvent(editorInstance)

    editorInstance.onDidChangeModelContent(() => {
        modelValue.value = editorInstance.getValue()
    })

    editorInstance.onDidFocusEditorWidget(() => {
        emits("focus", editorInstance)
    })
    editorInstance.onDidBlurEditorWidget(() => {
        emits("blur", editorInstance)
    })
    editorInstance.onDidChangeModel(() => {
        emits("change", editorInstance, editorInstance.getValue())
    })

    editorRef.value = editorInstance
})

onBeforeUnmount(() => {
    if (editorRef.value) {
        editorRef.value.dispose()
        editorRef.value = null
    }
})

watch(() => modelValue.value, (value) => {
    if (editorRef.value?.getValue() !== value) {
        editorRef.value?.setValue(value)
    }
})

watch(() => editorTheme.value, (theme) => {
    editorRef.value?.updateOptions({
        theme
    })
})

defineExpose({
    elementRef,
    editorRef,
})
</script>

<template>
    <div
        :id="id"
        class="markdown-editor"
        ref="elementRef"
    />
</template>
