import {editor, Range} from "monaco-editor/esm/vs/editor/editor.api.js";
import {blobToDataURL} from "@/utils/image/blobToDataUrl.ts";
import {onBeforeUnmount, onMounted} from "vue";
import {
    getParentMarkdownEditorElement
} from "@/components/markdown/editor/MarkdownEditorElement.ts";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

const insertImage = async (editor: IStandaloneCodeEditor, blobs: Blob[] | FileList | never) => {
    for (const blob of blobs) {
        if (!blob.type.startsWith("image/")) continue

        const selection = editor.getSelection()
        if (!selection) return;

        const range = new Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
        )

        const dataUrl = await blobToDataURL(blob)
        const valueInRange = editor.getModel()?.getValueInRange(range) ?? ""
        editor.executeEdits('image import', [
            {
                range: range,
                text: `![${valueInRange}](\n${dataUrl}\n)\n`,
                forceMoveMarkers: true
            }
        ])
    }
}

export const useMarkdownImageImport = () => {
    const onPaste = async (e: ClipboardEvent) => {
        const editorElement = getParentMarkdownEditorElement(e.target)

        if (!editorElement) return
        if (!editorElement.editor) return

        const editor = editorElement.editor

        // https://blog.csdn.net/qq_40147756/article/details/142148551
        const files = e.clipboardData?.files
        if (!files) return

        e.preventDefault()
        e.stopPropagation()
        await insertImage(editor, files)
    }

    const onDrop = async (e: DragEvent) => {
        const editorElement = getParentMarkdownEditorElement(e.target)

        if (!editorElement) return
        if (!editorElement.editor) return

        const editor = editorElement.editor

        const files = e.dataTransfer?.files
        if (!files) return

        e.preventDefault()
        e.stopPropagation()
        await insertImage(editor, files)
    }

    onMounted(() => {
        window.addEventListener('paste', onPaste, {capture: true})
        window.addEventListener('drop', onDrop, {capture: true})
    })

    onBeforeUnmount(() => {
        window.removeEventListener('paste', onPaste)
        window.removeEventListener('drop', onDrop)
    })
}