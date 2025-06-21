import {
    BaseDirectory,
    create,
    exists,
    FileHandle,
    readDir,
    readTextFile,
    remove,
    rename,
    writeTextFile
} from "@tauri-apps/plugin-fs";

export const jsonFileOperations = {
    isExisted: async (key: string) => {
        const path = `${key}.json`
        return await exists(path, {baseDir: BaseDirectory.AppLocalData})
    },

    list: async (): Promise<string[]> => {
        try {
            const files = await readDir('', {baseDir: BaseDirectory.AppLocalData})
            return files
                .filter(file => file.name?.endsWith('.json'))
                .map(file => file.name!.replace('.json', ''))
        } catch (e) {
            console.error(e)
            throw new Error("list json error")
        }
    },

    get: async (key: string): Promise<string> => {
        try {
            const path = `${key}.json`
            return await readTextFile(path, {baseDir: BaseDirectory.AppLocalData})
        } catch (e) {
            console.error(e)
            throw new Error("get json error")
        }
    },

    create: async (key: string): Promise<FileHandle> => {
        try {
            const path = `${key}.json`
            return await create(path, {baseDir: BaseDirectory.AppLocalData})
        } catch (e) {
            console.error(e)
            throw new Error("create json error")
        }
    },

    move: async (key: string, newKey: string): Promise<void> => {
        try {
            const path = `${key}.json`
            const newPath = `/${newKey}.json`
            return await rename(path, newPath, {
                oldPathBaseDir: BaseDirectory.AppLocalData,
                newPathBaseDir: BaseDirectory.AppLocalData
            })
        } catch (e) {
            console.error(e)
            throw new Error("move json error")
        }
    },

    set: async (key: string, value: string): Promise<void> => {
        try {
            const path = `${key}.json`
            return await writeTextFile(path, value, {baseDir: BaseDirectory.AppLocalData})
        } catch (e) {
            console.error(e)
            throw new Error("set json error")
        }
    },

    remove: async (key: string): Promise<void> => {
        try {
            const path = `${key}.json`
            return await remove(path, {baseDir: BaseDirectory.AppLocalData})
        } catch (e) {
            console.error(e)
            throw new Error("remove json error")
        }
    },
}
