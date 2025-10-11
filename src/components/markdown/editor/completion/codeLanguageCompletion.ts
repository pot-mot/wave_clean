import {languages, Range} from "monaco-editor/esm/vs/editor/editor.api.js";
type CompletionItemProvider = languages.CompletionItemProvider;
type CompletionItem = languages.CompletionItem;
import CompletionItemKind = languages.CompletionItemKind;
import {getCurrentFoldingRange, getFoldingRanges} from "@/components/markdown/editor/folding/ModelWithFoldingRanges.ts";
import {allLanguages} from "@/components/markdown/preview/plugins/MarkdownItPrismCode.ts";

const codeblockStart = /^\s*(```|~~~)/

export const markdownCodeLanguageCompletionProvider: CompletionItemProvider = {
    provideCompletionItems: (model, position) => {
        const line = model.getLineContent(position.lineNumber)
        const wordAtPosition = model.getWordUntilPosition(position)

        const suggestions: CompletionItem[] = []
        const range = new Range(
            position.lineNumber,
            wordAtPosition.startColumn,
            position.lineNumber,
            wordAtPosition.endColumn,
        )

        const foldingRange = getCurrentFoldingRange(position.lineNumber, getFoldingRanges(model))

        if (foldingRange) {
            if (foldingRange.start === position.lineNumber) {
                if (codeblockStart.test(line)) {
                    for (const language of allLanguages) {
                        suggestions.push({
                            label: language,
                            kind: CompletionItemKind.Keyword,
                            insertText: language,
                            range,
                        })
                    }
                }
            }
        }

        return {
            suggestions
        }
    }
}