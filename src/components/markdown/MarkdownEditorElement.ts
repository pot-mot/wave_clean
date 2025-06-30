import Vditor from "vditor";

export type MarkdownEditorElement = HTMLElement & {
    editor?: Vditor | null
}

export const checkIsMarkdownEditorElement = (e: any): e is MarkdownEditorElement => {
    return e instanceof HTMLElement && e.classList.contains("markdown-editor") &&
        (
            ("editor" in e && (e.editor instanceof Vditor || e.editor === null || e.editor === undefined)) ||
            !("editor" in e)
        )
}