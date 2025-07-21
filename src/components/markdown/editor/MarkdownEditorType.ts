import {editor} from "monaco-editor/esm/vs/editor/editor.api.js";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

export type MarkdownEditorProps = {
    theme?: "vs" | "vs-dark" | undefined,
}

export type MarkdownEditorEmits = {
    (event: "change", editor: IStandaloneCodeEditor, value: string): void
    (event: "focus", editor: IStandaloneCodeEditor): void
    (event: "blur", editor: IStandaloneCodeEditor): void
}