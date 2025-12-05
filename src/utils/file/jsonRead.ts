import type {SchemaValidator} from "@/utils/type/typeGuard.ts";
import type {ErrorObject} from "ajv";
import {readFileUsingInput, readFileUsingTauri} from "@/utils/file/fileRead.ts";
import {noTauriInvokeSubstitution} from "@/utils/error/noTauriInvokeSubstitution.ts";

export const removeJsonSuffix = (fileName: string) => {
    const index = fileName.lastIndexOf('.')
    if (index === -1) {
        return fileName
    }
    return fileName.substring(0, index)
}

export const readJson = async <T>(jsonValidator: SchemaValidator<T>): Promise<{name: string, data: T} | undefined> => {
    const fileList = await noTauriInvokeSubstitution<FileList | null>(
        async () => {
            return await readFileUsingTauri({
                filters: [{name: 'MindMap', extensions: ['json']}]
            })
        },
        async () => {
            return await readFileUsingInput(".json")
        },
    )

    const file = fileList?.item(0)
    if (!file) {
        return
    }

    const text = await file.text()
    const jsonData = JSON.parse(text)

    let error: ErrorObject[] | null | undefined
    if (!jsonValidator(jsonData, (e) => error = e)) {
        throw error
    }

    return {name: file.name, data: jsonData as T}
}
