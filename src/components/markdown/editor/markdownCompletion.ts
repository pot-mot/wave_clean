// Thanks for https://blog.csdn.net/qq_15686015/article/details/129560147, https://blog.kaciras.com/article/36/Integrate-monaco-editor-into-my-blog

import {editor, languages, KeyCode, Range, Position} from "monaco-editor/esm/vs/editor/editor.api.js";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor
import CompletionItemProvider = languages.CompletionItemProvider
import CompletionItemKind = languages.CompletionItemKind
import CompletionItemInsertTextRule = languages.CompletionItemInsertTextRule
import CompletionItem = languages.CompletionItem

type onEnterAppendTextOptions = {
    match: RegExpMatchArray,
    line: string,
    positionColumn: number,
    indent: string,
}

type onEnterCursorPositonOptions = {
    match: RegExpMatchArray,
    line: string,
    positionColumn: number,
    indent: string,
    appendText: string,
}

type onEnterAction = {
    // 匹配当前行的正则
    beforeText: RegExp
    // 生成新行内容的函数
    appendText: (options: onEnterAppendTextOptions) => string
    // 光标偏移位置，以初始缩进为准
    cursorPositionOffset?: (options: onEnterCursorPositonOptions) => { lineOffset: number; columnOffset: number }
}

const indentRegex = /^\s*/
const getIndent = (line: string): string => {
    const indentMatch = line.match(indentRegex)
    return indentMatch ? indentMatch[0] : ''
}

const taskRegex = /^\[[xX ]] /

const lineEnterActions: onEnterAction[] = [
    // orderedList
    {
        beforeText: /^\s*(\d+)\. (.*)$/,
        appendText: ({match, indent}) => {
            const current = parseInt(match[1], 10)
            if (taskRegex.test(match[2])) {
                return `\n${indent}${current + 1}. [ ] `
            }
            return `\n${indent}${current + 1}. `
        },
    },

    // unorderedList
    {
        beforeText: /^\s*([-+*]) (.*)$/,
        appendText: ({match, indent}) => {
            if (taskRegex.test(match[2])) {
                return `\n${indent}${match[1]} [ ] `
            }
            return `\n${indent}${match[1]} `
        },
    },

    // reference
    {
        beforeText: /^\s*> .*$/,
        appendText: ({indent}) => {
            return `\n${indent}> `
        }
    }
]

export const initMonacoMarkdownCompletion = (editor: IStandaloneCodeEditor) => {
    editor.onKeyDown((e) => {
        if (e.keyCode === KeyCode.Enter) {
            const model = editor.getModel()
            if (!model) return
            const position = editor.getPosition()
            if (!position) return
            const line = model.getLineContent(position.lineNumber)
            const lineBeforePosition = line.substring(0, position.column - 1)

            const matchedAction = lineEnterActions.find(rule => rule.beforeText.test(lineBeforePosition))

            if (matchedAction) {
                e.preventDefault()
                const indent = getIndent(line)
                const match = lineBeforePosition.match(matchedAction.beforeText)
                if (match) {
                    const appendText = matchedAction.appendText({
                        match,
                        line,
                        positionColumn: position.column,
                        indent
                    })
                    editor.executeEdits('enterAction', [
                        {
                            range: new Range(
                                position.lineNumber,
                                position.column,
                                position.lineNumber,
                                position.column
                            ),
                            text: appendText,
                            forceMoveMarkers: true
                        }
                    ])

                    if (matchedAction.cursorPositionOffset) {
                        const {lineOffset, columnOffset} = matchedAction.cursorPositionOffset({
                            match,
                            line,
                            positionColumn: position.column,
                            indent,
                            appendText
                        })
                        editor.setPosition(new Position(position.lineNumber + lineOffset, position.column + columnOffset))
                    }
                }
            }
        }
    })
}

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

// markdown 代码补全
export const markdownCompletionProvider: CompletionItemProvider = {
    triggerCharacters: ["", "#", "$", "`", "~"],
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

        if (context.triggerCharacter === undefined) {
            console.log(wordAtPosition)
            return {suggestions}
        } else if (context.triggerCharacter === "#") {
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
                kind: CompletionItemKind.Snippet,
                insertText: `${startFence}\${1:language}\n\n${endFence}`,
                insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
                range
            })
        } else if (context.triggerCharacter === "$") {
            const startColumn = getRepeatStartColumn("$", line, position.column)
            if (!emptyReg.test(line.slice(0, startColumn - 1))) return {suggestions}
            const currentLevel = position.column - startColumn
            if (currentLevel > 2) return {suggestions}

            const startFence = "$".repeat(2 - currentLevel)
            suggestions.push({
                label: 'Math Block',
                kind: CompletionItemKind.Snippet,
                insertText: `${startFence}\n\${1:}\n$$`,
                insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
                range,
            })
        }

        return {suggestions}
    }
}