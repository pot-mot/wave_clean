import {editor} from "monaco-editor/esm/vs/editor/editor.api.js";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import {getMatchedElementOrParent} from "@/utils/event/judgeEventTarget.ts";

export type MarkdownEditorElement = HTMLElement & {
    editor?: IStandaloneCodeEditor | null
}

export const checkIsMarkdownEditorElement = (el: any): el is MarkdownEditorElement => {
    return el instanceof HTMLElement && el.classList.contains("markdown-editor")
}

export const getParentMarkdownEditorElement = (el: any): MarkdownEditorElement | null => {
    if (!(el instanceof Element)) return null

    const matchResult = getMatchedElementOrParent(el, checkIsMarkdownEditorElement)
    if (!matchResult) return null

    if (checkIsMarkdownEditorElement(matchResult)) return matchResult
    else return null
}