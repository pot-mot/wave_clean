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
    list: async (): Promise<string[]> => {
        try {
            const files = await readDir('', {baseDir: BaseDirectory.AppLocalData})
            return files
                .filter(file => file.name?.endsWith('.json'))
                .map(file => file.name!.replace('.json', ''))
        } catch (e) {
            console.error("list json error", e)
            return []
        }
    },

    get: async (key: string): Promise<string | undefined> => {
        try {
            const path = `${key}.json`
            const targetExists = await exists(path, {baseDir: BaseDirectory.AppLocalData})
            if (!targetExists) {
                console.error(`file ${path} not exist`)
                return
            }
            return await readTextFile(path, {baseDir: BaseDirectory.AppLocalData})
        } catch (e) {
            console.error("get json error", e)
            return
        }
    },

    create: async (key: string): Promise<FileHandle | undefined> => {
        try {
            const path = `${key}.json`
            const targetExists = await exists(path, {baseDir: BaseDirectory.AppLocalData})
            if (targetExists) {
                console.error(`file ${path} is already exist`)
                return
            }
            return await create(path, {baseDir: BaseDirectory.AppLocalData})
        } catch (e) {
            console.error("create json error", e)
            return
        }
    },

    move: async (key: string, newKey: string): Promise<void> => {
        try {
            const path = `${key}.json`
            const targetExists = await exists(path, {baseDir: BaseDirectory.AppLocalData})
            if (targetExists) {
                console.error(`file ${path} is already exist`)
                return
            }
            const newPath = `/${newKey}.json`
            return await rename(path, newPath, {
                oldPathBaseDir: BaseDirectory.AppLocalData,
                newPathBaseDir: BaseDirectory.AppLocalData
            })
        } catch (e) {
            console.error("move json error", e)
            return
        }
    },

    set: async (key: string, value: string): Promise<void> => {
        try {
            const path = `${key}.json`
            const targetExists = await exists(path, {baseDir: BaseDirectory.AppLocalData})
            if (!targetExists) {
                console.error(`file ${path} not exist`)
                return
            }
            return await writeTextFile(path, value, {baseDir: BaseDirectory.AppLocalData})
        } catch (e) {
            console.error("set json error", e)
            return
        }
    },

    remove: async (key: string): Promise<void> => {
        try {
            const path = `${key}.json`
            const targetExists = await exists(path, {baseDir: BaseDirectory.AppLocalData})
            if (!targetExists) {
                console.error(`file ${path} not exist`)
                return
            }
            return await remove(path, {baseDir: BaseDirectory.AppLocalData})
        } catch (e) {
            console.error("remove json error", e)
            return
        }
    },
}
