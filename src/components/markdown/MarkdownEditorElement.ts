import {ExposeParam} from "md-editor-v3";

export type MarkdownEditorElement = Element & {
    editor?: ExposeParam | null
}

export const checkIsMarkdownEditorElement = (e: Element): e is MarkdownEditorElement => {
    return "editor" in e && e.classList.contains("md-markdown")
}