import {SchemaValidator} from "@/utils/type/typeGuard.ts";
import {readText, writeText} from "@tauri-apps/plugin-clipboard-manager";
import {LazyData, lazyDataParse} from "@/utils/type/lazyDataParse.ts";

export type ClipBoardTarget<INPUT, OUTPUT> = {
    importData: (data: INPUT) => void | Promise<void>,
    exportData: LazyData<OUTPUT>,
    removeData: (data: OUTPUT) => void | Promise<void>,
    validateInput: SchemaValidator<INPUT>,
    stringifyData: (data: OUTPUT) => string
}

export const copyText = async (text: string) => {
    try {
        await writeText(text)
    } catch (e) {
        await window.navigator.clipboard.writeText(text)
    }
}

export const useClipBoard = <INPUT, OUTPUT>(target: ClipBoardTarget<INPUT, OUTPUT>) => {
    const copy = async (lazyData: LazyData<OUTPUT> = target.exportData): Promise<OUTPUT> => {
        const data = await lazyDataParse(lazyData)
        try {
            await writeText(target.stringifyData(data))
        } catch (e) {
            await window.navigator.clipboard.writeText(target.stringifyData(data))
        }
        return data
    }

    const cut = async (): Promise<OUTPUT> => {
        const data = await copy()
        await target.removeData(data)
        return data
    }

    const paste = async (): Promise<INPUT | string | undefined> => {
        let text: string | undefined
        try {
            text = await readText()
        } catch (e) {
            text = await window.navigator.clipboard.readText()
        }

        const data = JSON.parse(text)
        let errors: any
        if (target.validateInput(data, e => errors = e)) {
            await target.importData(data)
            return data
        } else {
            throw errors
        }
    }

    return {
        copy,
        cut,
        paste,
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
}
