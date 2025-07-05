import {editor} from "monaco-editor/esm/vs/editor/editor.api.js";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

export type MarkdownEditorElement = HTMLElement & {
    editor?: IStandaloneCodeEditor | null
}

export const checkIsMarkdownEditorElement = (e: any): e is MarkdownEditorElement => {
    return e instanceof HTMLElement && e.classList.contains("markdown-editor")
}