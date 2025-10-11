// Thanks for https://blog.csdn.net/qq_15686015/article/details/129560147, https://blog.kaciras.com/article/36/Integrate-monaco-editor-into-my-blog
import {languages, Range} from "monaco-editor/esm/vs/editor/editor.api.js";
type CompletionItemProvider = languages.CompletionItemProvider
type CompletionItem = languages.CompletionItem
import CompletionItemKind = languages.CompletionItemKind
import {
    COMMAND_setPosition,
} from "@/components/markdown/editor/command/customCommand.ts";
import {getIndent} from "@/components/markdown/editor/indent/getIndent.ts";

// 获取重复字符的起始位置
const getRepeatStartIndex = (target: string, line: string, currentIndex: number): number => {
    let idx = currentIndex
    while (idx >= 0 && line[idx] === target) {
        idx--
    }
    return idx
}

const getRepeatStartColumn = (target: string, line: string, currentColumn: number): number => {
    return getRepeatStartIndex(target, line, currentColumn - 2) + 2
}

const titles = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']

const emptyReg = /^\s*$/

export const markdownCharCompletionProvider: CompletionItemProvider = {
    triggerCharacters: ["#", "$", "`", "~"],
    provideCompletionItems: (model, position, context) => {
        const line = model.getLineContent(position.lineNumber)
        const wordAtPosition = model.getWordUntilPosition(position)

        const suggestions: CompletionItem[] = []
        const range = new Range(
            position.lineNumber,
            wordAtPosition.startColumn,
            position.lineNumber,
            wordAtPosition.endColumn,
        )

        if (context.triggerCharacter === "#") {
            const startColumn = getRepeatStartColumn("#", line, position.column)
            if (!emptyReg.test(line.slice(0, startColumn - 1))) return {suggestions}
            const currentLevel = position.column - startColumn
            if (currentLevel > 6) return {suggestions}

            titles
                .filter((_, i) => (i + 1) >= currentLevel)
                .forEach((h, i) => suggestions.push({
                    label: h,
                    kind: CompletionItemKind.Text,
                    insertText: `${'#'.repeat(i)} `,
                    range,
                }))
        } else if (context.triggerCharacter === "`" || context.triggerCharacter === "~") {
            const fenceChar = context.triggerCharacter
            const startColumn = getRepeatStartColumn(fenceChar, line, position.column)
            if (!emptyReg.test(line.slice(0, startColumn - 1))) return {suggestions}
            const currentLevel = position.column - startColumn
            if (currentLevel > 3) return {suggestions}

            const startFence = fenceChar.repeat(3 - currentLevel)
            const endFence = fenceChar.repeat(3)
            suggestions.push({
                label: 'Code Block',
                kind: CompletionItemKind.Module,
                insertText: `${startFence}\n\n${endFence}`,
                range,
                command: {
                    id: COMMAND_setPosition,
                    title: "Set Position",
                    arguments: [
                        model.uri,
                        {
                            lineNumber: position.lineNumber,
                            column: position.column + startFence.length
                        }
                    ]
                }
            })
        } else if (context.triggerCharacter === "$") {
            const startColumn = getRepeatStartColumn("$", line, position.column)
            if (!emptyReg.test(line.slice(0, startColumn - 1))) return {suggestions}
            const currentLevel = position.column - startColumn
            if (currentLevel > 2) return {suggestions}

            const startFence = "$".repeat(2 - currentLevel)
            const indent = getIndent(line)
            suggestions.push({
                label: 'Math Block',
                kind: CompletionItemKind.Module,
                insertText: `${startFence}\n\n$$`,
                range,
                command: {
                    id: COMMAND_setPosition,
                    title: "Set Position",
                    arguments: [
                        model.uri,
                        {
                            lineNumber: position.lineNumber + 1,
                            column: 1 + indent.length
                        }
                    ]
                }
            })
        }

        return {suggestions}
    }
}