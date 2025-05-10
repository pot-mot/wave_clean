import {SchemaValidator} from "@/type/typeGuard.ts";
import {judgeTargetIsInteraction} from "@/mindMap/clickUtils.ts";

export type ClipBoardTarget<INPUT, OUTPUT> = {
    importData: (data: INPUT) => void | Promise<void>,
    exportData: () => OUTPUT | Promise<OUTPUT>,
    removeData: (data: OUTPUT) => void | Promise<void>,
    validateInput: SchemaValidator<INPUT>,
    stringifyData: (data: OUTPUT) => string
}

export const useClipBoard = <INPUT, OUTPUT>(target: ClipBoardTarget<INPUT, OUTPUT>) => {
    const copy = async (): Promise<OUTPUT> => {
        const data: OUTPUT = await target.exportData()
        await navigator.clipboard.writeText(target.stringifyData(data))
        return data
    }

    const cut = async (): Promise<OUTPUT> => {
        const data = await copy()
        await target.removeData(data)
        return data
    }

    const paste = async (): Promise<INPUT | string> => {
        const text = await navigator.clipboard.readText()
        try {
            const data = JSON.parse(text)
            if (target.validateInput(data)) {
                await target.importData(data)
                return data
            } else {
                return text
            }
        } catch (e) {
            return text
        }
    }

    const handleKeyDownEvent = async (e: KeyboardEvent) => {
        if (judgeTargetIsInteraction(e)) return

        if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
            e.preventDefault()
            await copy()
        } else if (e.ctrlKey && (e.key === "x" || e.key === "X")) {
            e.preventDefault()
            await cut()
        } else if (e.ctrlKey && (e.key === "v" || e.key === "V")) {
            e.preventDefault()
            await paste()
        }
    }

    return {
        copy,
        cut,
        paste,

        handleKeyDownEvent,
    }
}

export type CustomClipBoard<INPUT, OUTPUT> = ReturnType<typeof useClipBoard<INPUT, OUTPUT>>

export const unimplementedClipBoard: CustomClipBoard<any, any> = {
    copy: async () => {
        throw new Error("Unimplemented")
    },
    cut: async () => {
        throw new Error("Unimplemented")
    },
    paste: async () => {
        throw new Error("Unimplemented")
    },

    handleKeyDownEvent: async () => {
        throw new Error("Unimplemented")
    }
}
