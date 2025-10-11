import {editor, KeyCode, Position, Range} from "monaco-editor/esm/vs/editor/editor.api.js"
type IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import {getIndent} from "@/components/markdown/editor/indent/getIndent.ts";

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

export const initMarkdownEnterCompletion = (editor: IStandaloneCodeEditor) => {
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