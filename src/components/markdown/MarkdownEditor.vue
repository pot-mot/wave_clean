<script setup lang="ts">
import {config, ExposeParam, MdEditor, MdPreview} from "md-editor-v3";
import {Theme} from "@tauri-apps/api/window";
import {nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef} from "vue";
import {v7 as uuid} from "uuid";
import {MarkdownEditorElement} from "@/components/markdown/MarkdownEditorElement.ts";
import {keymap} from '@codemirror/view';

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
    (event: "blur"): void
}>()

const id = `markdown-editor-${uuid()}`

const editorRef = useTemplateRef<ExposeParam>("editorRef")
const elementRef = shallowRef<MarkdownEditorElement | undefined>()

config({
    codeMirrorExtensions(_, extensions, keyBindings) {
        const newExtensions = [...extensions];
        newExtensions.shift();

        const ModY = keyBindings.filter((i) => i.key === 'Mod-y')[0]

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

defineExpose({
    editorRef,
    elementRef,
})
</script>

<template>
    <div class="md-editor-wrapper">
        <MdEditor
            :id="id"
            ref="editorRef"

            v-model="modelValue"
            :theme="theme"
            :toolbars="[]"
            :footers="[]"
            :preview="false"
            @blur="emits('blur')"
        />
        <MdPreview
            v-if="previewOnly"
            :model-value="modelValue"
            :theme="theme"
        />
    </div>
</template>

<style scoped>
.md-editor-wrapper {
    position: relative;
    height: 100%;
    width: 100%;
    border: var(--border);
    border-radius: var(--border-radius);
}

.md-editor {
    height: 100%;
    width: 100%;

    font-family: inherit !important;
}

.md-editor-previewOnly {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;

    font-family: inherit !important;
}

:deep(.cm-scroller) {
    font-family: inherit !important;
}

:deep(.cm-content),
:deep(.cm-line) {
    cursor: text;
    font-family: inherit !important;
    tab-size: 4 !important;
    line-height: 1.5rem !important;
    font-size: v-bind(fontSize+ 'px') !important;
}
</style>