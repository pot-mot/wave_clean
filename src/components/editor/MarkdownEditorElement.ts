import {ExposeParam} from "md-editor-v3";

export type MarkdownEditorElement = Element & {
    ref?: ExposeParam | null
}

export const checkIsMarkdownEditorElement = (e: Element): e is MarkdownEditorElement => {
    return "ref" in e
}