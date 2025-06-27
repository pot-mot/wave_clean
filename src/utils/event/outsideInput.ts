import {checkIsInputOrTextarea, checkIsMdEditor, getMatchedElementOrParent} from "@/utils/event/judgeEventTarget.ts";
import {checkIsMarkdownEditorElement} from "@/components/editor/MarkdownEditorElement.ts";

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
    } else if (checkIsMdEditor(target)) {
        const parent = getMatchedElementOrParent(target, (el) => el.classList.contains('md-editor'))
        if (parent && checkIsMarkdownEditorElement(parent) && parent.ref) {
            parent.ref.insert(() => {
                return {targetValue: value, select: false}
            })
        }
    }
}