import {jsonFileOperations} from "@/file/JsonFileOperations.ts";
import {readonly, ref, watch} from "vue";
import {MindMapData} from "@/mindMap/useMindMap.ts";
import {validateMindMapData} from "@/mindMap/clipBoard/inputParse.ts";

const metaFileName = '[[WAVE_CLEAN_EDIT_META]]'

type Meta = {
    items: {
        key: string,
        name: string,
        lastEditTime: string
    }[]
}

const initFileStore = () => {
    const meta = ref<Meta>({items: []})

    watch(() => meta.value, async () => {
        await jsonFileOperations.set(metaFileName, JSON.stringify(meta.value))
    })

    const add = async (index: number, name: string) => {
        const timestamp = new Date()
        const key = name + Date.now()
        const fileHandle = await jsonFileOperations.create(key)
        if (fileHandle === undefined) {
            return
        }
        meta.value.items.splice(index, 0, {key, name, lastEditTime: timestamp.toString()})
    }

    const rename = async (key: string, newName: string) => {
        for (const it of meta.value.items) {
            if (it.key === key) {
                it.name = newName
            }
        }
    }

    const remove = async (key: string) => {
        await jsonFileOperations.remove(key)
        meta.value.items = meta.value.items.filter(item => item.key !== key)
    }

    const update = async (key: string, mindMapData: MindMapData) => {
        await jsonFileOperations.set(key, JSON.stringify(mindMapData))
    }

    const get = async (key: string): Promise<MindMapData> => {
        const data = await jsonFileOperations.get(key)
        if (data === undefined) {
            throw new Error(`mindMap ${key} not existed`)
        }
        const parsedData = JSON.parse(data)
        if (!validateMindMapData(parsedData)) {
            throw new Error(`invalid mindMap ${key}`)
        }
        return parsedData
    }

    (async () => {
        const metaValue = await jsonFileOperations.get(metaFileName)
        if (metaValue !== undefined) {
            try {
                meta.value.items = JSON.parse(metaValue)
            } catch (e) {
                await jsonFileOperations.set(metaFileName, "[]")
            }
        } else {
            await jsonFileOperations.create(metaFileName)
            console.log("created")
        }
    })()

    return {
        add,
        rename,
        remove,
        update,
        get,
        meta: readonly(meta)
    }
}

type FileStore = ReturnType<typeof initFileStore>

let fileStore: FileStore | undefined = undefined

export const useFileStore = () => {
    if (fileStore === undefined) {
        fileStore = initFileStore()
    }
    return fileStore
}
