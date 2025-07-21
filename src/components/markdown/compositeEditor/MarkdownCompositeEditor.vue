<script setup lang="ts">
import {v7 as uuid} from "uuid"
import {Pane, Splitpanes} from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import MarkdownEditor from "@/components/markdown/editor/MarkdownEditor.vue";
import MarkdownPreview from "@/components/markdown/preview/MarkdownPreview.vue";
import {computed, ref, useTemplateRef} from "vue";
import {MarkdownEditorEmits, MarkdownEditorProps} from "@/components/markdown/editor/MarkdownEditorType.ts";

const id = `markdown-composite-editor-${uuid()}`
const editorPaneId = `${id}-editor-pane`
const previewPaneId = `${id}-preview-pane`

const modelValue = defineModel<string>({
    required: true
})

const previewType = defineModel<'preview-only' | 'edit-only' | 'edit-preview'>('previewType', {
    required: false,
    default: 'edit-only',
})

const markdownEditorRef = useTemplateRef<InstanceType<typeof MarkdownEditor>>('markdownEditorRef')
const markdownPreviewRef = useTemplateRef<InstanceType<typeof MarkdownPreview>>('markdownPreviewRef')
const editorRef = computed(() => {
    return markdownEditorRef.value?.editorRef
})

const props = defineProps<MarkdownEditorProps>()
const emits = defineEmits<MarkdownEditorEmits>()

const isFullScreen = ref(false)

const toggleFullScreen = () => {
    isFullScreen.value = !isFullScreen.value
}

defineExpose({
    markdownEditorRef,
    markdownPreviewRef,
    editorRef,
})
</script>

<template>
    <div class="markdown-composite-editor">
        <Teleport to="body" :disabled="!isFullScreen">
            <div class="markdown-composite-editor-wrapper" :class="{fullscreen: isFullScreen}">
                <div>
                    <button @click="previewType = 'edit-only'">edit-only</button>
                    <button @click="previewType = 'preview-only'">preview-only</button>
                    <button @click="previewType = 'edit-preview'">edit-preview</button>

                    <button @click="toggleFullScreen">full-screen</button>
                </div>

                <Splitpanes v-show="previewType === 'edit-preview'">
                    <Pane size="50" :id="editorPaneId"/>
                    <Pane size="50" :id="previewPaneId"/>
                </Splitpanes>

                <Teleport defer :disabled="previewType === 'edit-only'" :to="`#${editorPaneId}`">
                    <MarkdownEditor
                        v-show="previewType !== 'preview-only'"
                        ref="markdownEditorRef"
                        class="editor"
                        v-model="modelValue"
                        v-bind="props"
                        @change="(editor, value) => emits('change', editor, value)"
                        @focus="(editor) => emits('focus', editor)"
                        @blur="(editor) => emits('blur', editor)"
                    />
                </Teleport>

                <Teleport defer :disabled="previewType === 'preview-only'" :to="`#${previewPaneId}`">
                    <MarkdownPreview
                        v-if="previewType !== 'edit-only'"
                        ref="markdownPreviewRef"
                        class="preview"
                        :value="modelValue"
                    />
                </Teleport>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.markdown-composite-editor-wrapper {
    height: 100%;
    width: 100%;
}

.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    z-index: var(--top-z-index);
}

.editor {
    height: 100%;
    width: 100%;
}

.preview {
    height: 100%;
    width: 100%;
}
</style>
