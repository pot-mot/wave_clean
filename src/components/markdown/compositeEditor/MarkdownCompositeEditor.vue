<script setup lang="ts">
import {v7 as uuid} from "uuid"
import MarkdownEditor from "@/components/markdown/editor/MarkdownEditor.vue";
import MarkdownPreview from "@/components/markdown/preview/MarkdownPreview.vue";
import {computed, ref, useTemplateRef} from "vue";
import {MarkdownEditorEmits, MarkdownEditorProps} from "@/components/markdown/editor/MarkdownEditorType.ts";
import {PreviewType} from "@/components/markdown/compositeEditor/PreviewType.ts";
import Splitpanes from "@/components/splitpanes/Splitpanes.vue";
import Pane from "@/components/splitpanes/Pane.vue";

const id = `markdown-composite-editor-${uuid()}`
const editorPaneId = `${id}-editor-pane`
const previewPaneId = `${id}-preview-pane`

const modelValue = defineModel<string>({
    required: true
})

const previewType = defineModel<PreviewType>('previewType', {
    required: false,
    default: 'edit-only',
})

const containerRef = useTemplateRef<HTMLDivElement>('containerRef')
const markdownEditorRef = useTemplateRef<InstanceType<typeof MarkdownEditor>>('markdownEditorRef')
const markdownPreviewRef = useTemplateRef<InstanceType<typeof MarkdownPreview>>('markdownPreviewRef')
const editorRef = computed(() => {
    return markdownEditorRef.value?.editorRef
})

type ClassPropType = string | Record<string, any> | string[]

const props = withDefaults(defineProps<MarkdownEditorProps & {
    editorClass?: ClassPropType,
    previewClass?: ClassPropType,
    zoom?: number,
    fullScreenTeleportTarget?: string | HTMLElement,
    fullScreenZIndex?: string,
}>(), {
    zoom: 1,
    fullScreenZIndex: "1000000",
    fullScreenTeleportTarget: 'body',
})
const emits = defineEmits<MarkdownEditorEmits>()

const isFullScreen = ref(false)

const toggleFullScreen = () => {
    isFullScreen.value = !isFullScreen.value
}

defineExpose({
    containerRef,
    markdownEditorRef,
    markdownPreviewRef,
    editorRef,
    isFullScreen,
})
</script>

<template>
    <div class="markdown-composite-editor">
        <Teleport :to="fullScreenTeleportTarget" :disabled="!isFullScreen">
            <div class="markdown-composite-editor-wrapper" :class="{fullscreen: isFullScreen}">
                <div class="toolbar">
                    <div>
                        <button @click="previewType = 'edit-only'">edit-only</button>
                        <button @click="previewType = 'preview-only'">preview-only</button>
                        <button @click="previewType = 'edit-preview'">edit-preview</button>
                    </div>

                    <div>
                        <button @click="toggleFullScreen">full-screen</button>
                    </div>
                </div>

                <div class="container" ref="containerRef">
                    <Splitpanes
                        v-show="previewType === 'edit-preview'"
                        :maximize-panes="false"
                        :zoom="zoom"
                    >
                        <Pane :size="50" :id="editorPaneId"/>
                        <Pane :size="50" :id="previewPaneId"/>
                    </Splitpanes>

                    <Teleport defer :disabled="previewType === 'edit-only'" :to="`#${editorPaneId}`">
                        <MarkdownEditor
                            v-show="previewType !== 'preview-only'"
                            ref="markdownEditorRef"
                            class="editor"
                            :class="editorClass"
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
                            :class="previewClass"
                            :value="modelValue"
                        />
                    </Teleport>
                </div>
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
    z-index: v-bind(fullScreenZIndex);
}

.toolbar {
    height: 2rem;
    display: flex;
    justify-content: space-between;
    background-color: var(--background-color);
}

.container {
    height: calc(100% - 2rem);
    overflow: hidden;
    background-color: var(--background-color);
}

.editor {
    height: 100%;
    width: 100%;
}

.preview {
    height: 100%;
    width: 100%;
    padding: 0.5rem;
}
</style>
