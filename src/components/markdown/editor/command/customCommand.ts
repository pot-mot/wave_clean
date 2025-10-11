import {editor, type IPosition, type IRange, type ISelection} from "monaco-editor/esm/vs/editor/editor.api.js"

export const COMMAND_Group = "editor.custom.group"
export const COMMAND_setPosition = "editor.custom.setPosition"
export const COMMAND_setSelection = "editor.custom.setSelection"
export const COMMAND_removeRange = "editor.custom.removeRange"

const customCommandIdSet = new Set([COMMAND_Group, COMMAND_setPosition, COMMAND_setSelection])

const checkPosition = (args: any): args is IPosition => {
    return !!(args.lineNumber && args.column);
}

const checkSelection = (args: any): args is ISelection => {
    return !!(args.selectionStartLineNumber && args.selectionStartColumn && args.positionLineNumber && args.positionColumn);
}

const checkRange = (args: any): args is IRange => {
    return !!(args.startLineNumber && args.startColumn && args.endLineNumber && args.endColumn);
}

export const registerCustomCommands = () => {
    editor.registerCommand(COMMAND_Group, (_, ...args: any[]) => {
        if (!Array.isArray(args[1])) return
        const editorInstance = editor.getEditors().find(it => it.getModel()?.id === args[0])
        if (editorInstance) {
            for (const command of args[1]) {
                if (customCommandIdSet.has(command.id)) {
                    editorInstance.trigger("", command.id, [args[0], ...command.arguments])
                }
            }
        }
    })
    editor.registerCommand(
        COMMAND_setPosition,
        (_, ...args: any[]) => {
            if (!checkPosition(args[1])) return
            const editorInstance = editor.getEditors().find(it => it.getModel()?.uri === args[0])
            editorInstance?.setPosition(args[1])
        }
    )
    editor.registerCommand(
        COMMAND_setSelection,
        (_, ...args: any[]) => {
            if (!checkSelection(args[1])) return
            const editorInstance = editor.getEditors().find(it => it.getModel()?.uri === args[0])
            editorInstance?.setSelection(args[1])
        }
    )
    // https://blog.csdn.net/weixin_45855469/article/details/139613777 移除文本
    editor.registerCommand(
        COMMAND_removeRange,
        (_, ...args: any[]) => {
            if (!checkRange(args[1])) return
            const model = editor.getModel(args[0])
            model?.applyEdits([{
                range: args[1],
                text: "",
                forceMoveMarkers: true
            }])
        }
    )
}