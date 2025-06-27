<script setup lang="ts">
import {config, ExposeParam, MdEditor} from "md-editor-v3";
import {Theme} from "@tauri-apps/api/window";
import {nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef} from "vue";
import {v7 as uuid} from "uuid";
import {MarkdownEditorElement} from "@/components/editor/MarkdownEditorElement.ts";
import { keymap } from '@codemirror/view';

const modelValue = defineModel<string>({
    required: true
})

defineProps<{
    theme?: Theme | undefined
}>()

const id = `markdown-editor-${uuid()}`

const editorRef = useTemplateRef<ExposeParam>("editorRef")
const elementRef = shallowRef<MarkdownEditorElement | undefined>()

config({
    codeMirrorExtensions(_, extensions, keyBindings) {
        console.log(keyBindings)
        const newExtensions = [...extensions];
        newExtensions.shift();

        const ModY = keyBindings.filter((i) => i.key === 'Mod-y')[0]
        console.log(ModY)

        const CtrlShiftZ = {
            run: ModY.run,
            key: 'Ctrl-Shift-z',
            mac: 'Cmd-Shift-z',
        }

        return [keymap.of([CtrlShiftZ, ...keyBindings]), ...newExtensions];
    },
})

onMounted(async () => {
    await nextTick()
    const element = document.querySelector(`#${id}.md-editor`)
    if (element && element instanceof HTMLDivElement) {
        (element as MarkdownEditorElement).editor = editorRef.value
        elementRef.value = element
    }
})

onBeforeUnmount(() => {
    if (elementRef.value) {
        elementRef.value.editor = null
        elementRef.value = undefined
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