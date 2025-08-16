import {
    BaseDirectory,
    create,
    exists,
    readTextFile,
    remove,
    rename,
    writeTextFile
} from "@tauri-apps/plugin-fs";
import {noTauriInvokeSubstitution} from "@/utils/error/noTauriInvokeSubstitution.ts";

export const jsonFileOperations = {
    isExisted: async (key: string) => {
        const path = `${key}.json`
        return await noTauriInvokeSubstitution(async () => {
            return await exists(path, {baseDir: BaseDirectory.AppLocalData})
        }, async () => {
            return localStorage.getItem(path) !== null
        })
    },

    get: async (key: string): Promise<string> => {
        try {
            const path = `${key}.json`
            return await noTauriInvokeSubstitution(async () => {
                return await readTextFile(path, {baseDir: BaseDirectory.AppLocalData})
            }, async () => {
                const value = localStorage.getItem(path)
                if (value === null) {
                    throw new Error(`json [${path}] not found`)
                }
                return value
            })
        } catch (e) {
            console.error(e)
            throw new Error("get json error")
        }
    },

    create: async (key: string): Promise<void> => {
        try {
            const path = `${key}.json`
            await noTauriInvokeSubstitution(async () => {
                await create(path, {baseDir: BaseDirectory.AppLocalData})
            }, async () => {
                localStorage.setItem(path, "")
            })
        } catch (e) {
            console.error(e)
            throw new Error("create json error")
        }
    },

    move: async (key: string, newKey: string): Promise<void> => {
        try {
            const path = `${key}.json`
            const newPath = `/${newKey}.json`
            await noTauriInvokeSubstitution(async () => {
                return await rename(path, newPath, {
                    oldPathBaseDir: BaseDirectory.AppLocalData,
                    newPathBaseDir: BaseDirectory.AppLocalData
                })
            }, async () => {
                const value = localStorage.getItem(path)
                if (value === null) {
                    throw new Error(`json [${path}] not found`)
                }
                localStorage.setItem(newPath, value)
                localStorage.removeItem(path)
            })
        } catch (e) {
            console.error(e)
            throw new Error("move json error")
        }
    },

    set: async (key: string, value: string): Promise<void> => {
        try {
            const path = `${key}.json`
            await noTauriInvokeSubstitution(async () => {
                return await writeTextFile(path, value, {baseDir: BaseDirectory.AppLocalData})
            }, async () => {
                localStorage.setItem(path, value)
            })
        } catch (e) {
            console.error(e)
            throw new Error("set json error")
        }
    },

    remove: async (key: string): Promise<void> => {
        try {
            const path = `${key}.json`
            await noTauriInvokeSubstitution(async () => {
                return await remove(path, {baseDir: BaseDirectory.AppLocalData})
            }, async () => {
                localStorage.removeItem(path)
            })
        } catch (e) {
            console.error(e)
            throw new Error("remove json error")
        }
    },
}
