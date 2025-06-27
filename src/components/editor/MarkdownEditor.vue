<script setup lang="ts">
import {ExposeParam, MdEditor} from "md-editor-v3";
import {Theme} from "@tauri-apps/api/window";
import {nextTick, onMounted, useTemplateRef} from "vue";
import {v7 as uuid} from "uuid";
import {MarkdownEditorElement} from "@/components/editor/MarkdownEditorElement.ts";

const modelValue = defineModel<string>({
    required: true
})

defineProps<{
    theme?: Theme | undefined
}>()

const id = `markdown-editor-${uuid()}`

const editorRef = useTemplateRef<ExposeParam>("editorRef")

onMounted(async () => {
    await nextTick()
    const element = document.querySelector(`#${id}`)
    if (element && element instanceof HTMLDivElement) {
        (element as MarkdownEditorElement).ref = editorRef.value
    }
})
</script>

<template>
    <MdEditor
        :id="id"
        ref="editorRef"

        v-model="modelValue"
        :theme="theme"
        :toolbars="[]"
        :footers="[]"
        :preview="false"
    />
</template>

<style scoped>
:deep(.cm-scroller) {
    font-family: inherit !important;
    tab-size: 4 !important;
}
</style>