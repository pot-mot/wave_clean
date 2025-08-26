import {editor} from "monaco-editor/esm/vs/editor/editor.api.js";
import ICodeEditor = editor.ICodeEditor;
import {copyText, readClipBoardImageBlob, readClipBoardText} from "@/utils/clipBoard/useClipBoard.ts";
import {sendMessage} from "@/components/message/messageApi.ts";
import {blobToFile} from "@/utils/file/fileRead.ts";
import {MarkdownEditorElement} from "@/components/markdown/editor/MarkdownEditorElement.ts";

export const getTouchClipboard = (editor: ICodeEditor, element: MarkdownEditorElement) => {
    const copy = async (): Promise<boolean> => {
        try {
            const selection = editor.getSelection()
            if (!selection) return false
            const selectedText = editor.getModel()?.getValueInRange(selection)
            if (!selectedText) return false
            await copyText(selectedText)
            return true
        } catch (e) {
            sendMessage(`copy fail: ${e}`, {type: 'warning'})
            return false
        }
    }

    const cut = async (): Promise<boolean> => {
        try {
            const selection = editor.getSelection()
            if (!selection) return false
            const selectedText = editor.getModel()?.getValueInRange(selection)
            if (!selectedText) return false
            await copyText(selectedText)
            editor.executeEdits('cut', [{range: selection, text: ''}])
            return true
        } catch (e) {
            sendMessage(`cut fail: ${e}`, {type: 'warning'})
            return false
        }
    }

    const paste = async (): Promise<boolean> => {
        try {
            const selection = editor.getSelection()
            if (!selection) return false

            const text = await readClipBoardText()
            let hasText = false
            if (text) {
                hasText = true
                editor.executeEdits('paste', [{range: selection, text: text}])
            }

            const target = document.activeElement
            if (!target || !element.contains(target)) {
                return hasText
            }

            const dataTransfer = new DataTransfer()

            const imageBlobs = await readClipBoardImageBlob()
            if (!imageBlobs) return hasText

            for (const imageBlob of imageBlobs) {
                const imageFile = await blobToFile(imageBlob, "image")
                dataTransfer.items.add(imageFile)
            }
            const event = new ClipboardEvent("paste", {
                clipboardData: dataTransfer,
            })
            target.dispatchEvent(event)
            return true
        } catch (e) {
            sendMessage(`paste fail: ${e}`, {type: 'warning'})
            return false
        }
    }

    return {
        copy,
        cut,
        paste,
    }
}