import {languages, Range} from "monaco-editor/esm/vs/editor/editor.api.js";
import CompletionItemProvider = languages.CompletionItemProvider;
import CompletionItem = languages.CompletionItem;
import CompletionItemKind = languages.CompletionItemKind;
import {getCurrentFoldingRange, getFoldingRanges} from "@/components/markdown/editor/folding/ModelWithFoldingRanges.ts";
import {md} from "@/components/markdown/preview/markdownRender.ts";
import {katexExamples} from "@/components/markdown/editor/completion/katexExamples.ts";
import Command = languages.Command;
import {COMMAND_removeRange} from "@/components/markdown/editor/command/customCommand.ts";
import {katexLanguages} from "@/components/markdown/preview/plugins/MarkdownItPrismCode.ts";

const katexSuggestions: Omit<CompletionItem, 'range'>[] = katexExamples.flatMap(it => {
    return it.map(it2 => {
        return {
            label: it2,
            kind: CompletionItemKind.Keyword,
            insertText: it2,
        }
    })
})

export const markdownKatexCompletionProvider: CompletionItemProvider = {
    triggerCharacters: ["", "\\"],
    provideCompletionItems: (model, position, context) => {
        const wordAtPosition = model.getWordUntilPosition(position)

        const suggestions: CompletionItem[] = []
        let command: Command | undefined
        const range = new Range(
            position.lineNumber,
            wordAtPosition.startColumn,
            position.lineNumber,
            wordAtPosition.endColumn,
        )

        const foldingRange = getCurrentFoldingRange(position.lineNumber, getFoldingRanges(model))

        if (foldingRange) {
            const value = model.getValueInRange({
                startLineNumber: foldingRange.start,
                endLineNumber: foldingRange.end,
                startColumn: 1,
                endColumn: model.getLineMaxColumn(foldingRange.end),
            })

            const tokens = md.parse(value, {})
            if (tokens.length > 0) {
                if (
                    tokens[0].type === 'math_block' ||
                    (tokens[0].type === 'fence' && katexLanguages.has(tokens[0].info))
                ) {
                    if (context.triggerCharacter === '\\') {
                        command = {
                            id: COMMAND_removeRange,
                            title: "Remove Range",
                            arguments: [
                                model.uri,
                                {
                                    startLineNumber: position.lineNumber,
                                    endLineNumber: position.lineNumber,
                                    startColumn: position.column - 1,
                                    endColumn: position.column,
                                }
                            ]
                        }
                    }

                    suggestions.push(...katexSuggestions.map(it => {
                        return {...it, range, command}
                    }))
                }
            }
        }

        return {
            suggestions
        }
    }
}