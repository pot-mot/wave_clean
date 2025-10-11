import {languages} from "monaco-editor/esm/vs/editor/editor.api.js";
type CompletionItemProvider = languages.CompletionItemProvider;
import {getCurrentFoldingRange, getFoldingRanges} from "@/components/markdown/editor/folding/ModelWithFoldingRanges.ts";
import {md} from "@/components/markdown/preview/markdownRender.ts";
import {mermaidLanguages} from "@/components/markdown/preview/plugins/MarkdownItPrismCode.ts";
import {mermaidCompletionProvider} from "@/components/markdown/editor/mermaid/mermaidLanguage.ts";

export const markdownMermaidCompletionProvider: CompletionItemProvider = {
    triggerCharacters: ["", "\\"],
    provideCompletionItems: (model, position, context, token) => {
        const foldingRange = getCurrentFoldingRange(position.lineNumber, getFoldingRanges(model))

        if (foldingRange) {
            const value = model.getValueInRange({
                startLineNumber: foldingRange.start,
                endLineNumber: foldingRange.end,
                startColumn: 1,
                endColumn: model.getLineMaxColumn(foldingRange.end),
            })

            const tokens = md.parse(value, {})
            if (tokens.length > 0 && tokens[0]) {
                if (
                    (tokens[0].type === 'fence' && mermaidLanguages.has(tokens[0].info))
                ) {
                    return mermaidCompletionProvider.provideCompletionItems(model, position, context, token)
                }
            }
        }

        return {
            suggestions: []
        }
    }
}