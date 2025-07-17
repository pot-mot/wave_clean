import {editor} from "monaco-editor/esm/vs/editor/editor.api.js";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import {readClipBoardImageBlob} from "@/utils/clipBoard/useClipBoard.ts";
import {blobToDataURL} from "@/utils/image/blobToDataUrl.ts";

export const initMarkdownImageImportEvent = (editor: IStandaloneCodeEditor) => {
    editor.onDidPaste(async (e) => {
        try {
            const blob = await readClipBoardImageBlob()
            if (!blob) return

            const dataUrl = await blobToDataURL(blob)
            const valueInRange = editor.getModel()?.getValueInRange(e.range)
            editor.executeEdits('imagePaste', [
                {
                    range: e.range,
                    text: `![${valueInRange}](${dataUrl})`,
                    forceMoveMarkers: true
                }
            ])
        } catch {}
    })
}