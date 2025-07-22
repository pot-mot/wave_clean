<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, useTemplateRef, watch} from "vue";
import {MarkdownEditorElement} from "@/components/markdown/editor/MarkdownEditorElement.ts";
import {MarkdownEditorEmits, MarkdownEditorProps} from "@/components/markdown/editor/MarkdownEditorType.ts";

import {editor} from "monaco-editor/esm/vs/editor/editor.api.js";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
// 导入小图标
import "monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles.js";
// 导入主题
import "monaco-editor/esm/vs/editor/common/editorTheme.js"
// 导入右键菜单
import "monaco-editor/esm/vs/editor/contrib/contextmenu/browser/contextmenu.js"
// 导入搜索
import "monaco-editor/esm/vs/editor/contrib/find/browser/findController.js";
// 导入代码折叠
import "monaco-editor/esm/vs/editor/contrib/folding/browser/folding.js"
// 导入注释
import "monaco-editor/esm/vs/editor/contrib/comment/browser/comment.js";
// 导入多光标
import "monaco-editor/esm/vs/editor/contrib/multicursor/browser/multicursor.js";
// 代码提示控件
import "monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController.js";
// token解析
import "monaco-editor/esm/vs/editor/contrib/tokenization/browser/tokenization.js";
import {initMarkdownEnterCompletion} from "@/components/markdown/editor/completion/enterCompletion.ts";

const modelValue = defineModel<string>({
    required: true
})

const props = defineProps<MarkdownEditorProps>()

const emits = defineEmits<MarkdownEditorEmits>()

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

onMounted(async () => {
    const element = elementRef.value
    if (!element) {
        throw new Error("MarkdownEditor init fail, element not existed")
    }
    const editorInstance = editor.create(element, {
        language: "markdown",
        value: modelValue.value,
        theme: props.theme,
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
        dropIntoEditor: {enabled: true},
        wordBasedSuggestions: "off",

        autoClosingBrackets: 'languageDefined', // 是否自动添加结束括号(包括中括号) "always" | "languageDefined" | "beforeWhitespace" | "never"
        autoClosingDelete: 'never', // 是否自动删除结束括号(包括中括号) "always" | "never" | "auto"
        autoClosingQuotes: 'languageDefined', // 是否自动添加结束的单引号 双引号 "always" | "languageDefined" | "beforeWhitespace" | "never"
        autoSurround: "languageDefined",
    })

    initMarkdownEnterCompletion(editorInstance)

    editorInstance.onDidChangeModelContent(() => {
        // // debug tokenizer
        // const model = editorInstance.getModel()!
        // console.log(editor.tokenize(model.getValueInRange(model.getFullModelRange()), model.getLanguageId()))
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

watch(() => props.theme, (theme) => {
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
        class="markdown-editor"
        ref="elementRef"
    />
</template>
