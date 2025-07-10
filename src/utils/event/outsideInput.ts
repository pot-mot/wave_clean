import {checkIsInputOrTextarea, checkIsMarkdownEditor, getMatchedElementOrParent} from "@/utils/event/judgeEventTarget.ts";
import {checkIsMarkdownEditorElement} from "@/components/markdown/editor/MarkdownEditorElement.ts";
import {Range} from "monaco-editor/esm/vs/editor/editor.api.js";

export const outsideInput = (target: Element | EventTarget | null, value: string) => {
    if (target === null || target === undefined) return

    if (checkIsInputOrTextarea(target)) {
        const start = target.selectionStart ?? target.value.length
        const end = target.selectionEnd ?? target.value.length

        target.setRangeText(value, start, end, 'end')

        const inputEvent = new Event('input', { bubbles: true })
        target.dispatchEvent(inputEvent)

        const changeEvent = new Event('change')
        target.dispatchEvent(changeEvent)
    } else if (checkIsMarkdownEditor(target)) {
        const parent = getMatchedElementOrParent(target, (el) => el.classList.contains('markdown-editor'))
        if (parent && checkIsMarkdownEditorElement(parent) && parent.editor) {
            const editor = parent.editor

            const position = editor.getPosition()
            if (!position) return

            editor.executeEdits('outsideInput', [
                {
                    range: new Range(
                        position.lineNumber,
                        position.column,
                        position.lineNumber,
                        position.column
                    ),
                    text: value,
                    forceMoveMarkers: true
                }
            ])
        }
    }
}