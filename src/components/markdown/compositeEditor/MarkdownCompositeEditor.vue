<script setup lang="ts">
import {v7 as uuid} from "uuid"
import MarkdownEditor from "@/components/markdown/editor/MarkdownEditor.vue";
import MarkdownPreview from "@/components/markdown/preview/MarkdownPreview.vue";
import {computed, ref, useTemplateRef} from "vue";
import {MarkdownEditorEmits, MarkdownEditorProps} from "@/components/markdown/editor/MarkdownEditorType.ts";
import {PreviewType} from "@/components/markdown/compositeEditor/PreviewType.ts";
import Splitpanes from "@/components/splitpanes/Splitpanes.vue";
import Pane from "@/components/splitpanes/Pane.vue";
import IconUndo from "@/components/icons/IconUndo.vue";
import IconRedo from "@/components/icons/IconRedo.vue";
import IconFullScreen from "@/components/icons/IconFullScreen.vue";
import IconSearch from "@/components/icons/IconSearch.vue";
import IconImage from "@/components/icons/IconImage.vue";
import {insertImage} from "@/components/markdown/editor/image/markdownImageImport.ts";
import {noTauriInvokeSubstitution} from "@/utils/error/noTauriInvokeSubstitution.ts";
import {readFileUsingInput, readFileUsingTauri} from "@/utils/file/fileRead.ts";
import IconMarkdownEditOnly from "@/components/icons/IconMarkdownEditOnly.vue";
import IconMarkdownPreviewOnly from "@/components/icons/IconMarkdownPreviewOnly.vue";
import IconMarkdownEditPreview from "@/components/icons/IconMarkdownEditPreview.vue";

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

const splitpanesHorizontal = ref(false)

const toggleFullScreen = () => {
    isFullScreen.value = !isFullScreen.value
}

const changePreviewType = (type: PreviewType) => {
    if (type === 'edit-preview' && containerRef.value) {
        splitpanesHorizontal.value = containerRef.value.offsetWidth < containerRef.value.offsetHeight
    }
    previewType.value = type
}

const undo = () => {
    editorRef.value?.trigger('keyboard', 'undo', null)
}

const redo = () => {
    editorRef.value?.trigger('keyboard', 'redo', null)
}

const search = () => {
    // monaco-editor/esm/vs/editor/contrib/find/browser/findModel.js
    editorRef.value?.trigger('actions', 'actions.find', null)
}

const importImage = async () => {
    if (!editorRef.value) return

    const fileList = await noTauriInvokeSubstitution<FileList | null>(
        async () => {
            return await readFileUsingTauri({
                filters: [{name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp']}]
            })
        },
        async () => {
            return await readFileUsingInput("image/*")
        },
    )
    if (!fileList) return
    await insertImage(editorRef.value, fileList)
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
                    <div class="left">
                        <div class="segment">
                            <button
                                @click="changePreviewType('edit-only')"
                                :class="{enabled: previewType === 'edit-only'}"
                            >
                                <IconMarkdownEditOnly/>
                            </button>
                            <button
                                @click="changePreviewType('edit-preview')"
                                :class="{enabled: previewType === 'edit-preview'}"
                            >
                                <IconMarkdownEditPreview/>
                            </button>
                            <button
                                @click="changePreviewType('preview-only')"
                                :class="{enabled: previewType === 'preview-only'}"
                            >
                                <IconMarkdownPreviewOnly/>
                            </button>
                        </div>

                        <div class="segment">
                            <button @click="search">
                                <IconSearch/>
                            </button>
                        </div>

                        <div class="segment">
                            <button @click="undo">
                                <IconUndo/>
                            </button>
                            <button @click="redo">
                                <IconRedo/>
                            </button>
                        </div>

                        <div class="segment">
                            <button @click="importImage">
                                <IconImage/>
                            </button>
                        </div>
                    </div>

                    <div class="right">
                        <button
                            @click="toggleFullScreen"
                            :class="{enabled: isFullScreen}"
                        >
                            <IconFullScreen/>
                        </button>
                    </div>
                </div>

                <div class="container" ref="containerRef">
                    <Splitpanes
                        v-show="previewType === 'edit-preview'"
                        :maximize-panes="false"
                        :zoom="zoom"
                        :horizontal="splitpanesHorizontal"
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
    display: grid;
    grid-template-areas:
        "toolbar"
        "container";
    grid-template-rows: auto 1fr;
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
    grid-area: toolbar;

    display: flex;
    justify-content: space-between;
    background-color: var(--background-color);
    padding: 0 0.5rem;
    overflow: auto;
}

.toolbar > .left {
    display: flex;
    gap: 0.25rem;
}

.toolbar > .left > .segment {
    white-space: nowrap;
}

.toolbar button {
    padding: 0.5rem;
    border: none;
}

.toolbar button.enabled {
    background-color: var(--background-color-hover);
}

.container {
    grid-area: container;

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
