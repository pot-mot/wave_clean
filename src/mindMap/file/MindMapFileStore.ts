import {jsonFileOperations} from "@/file/JsonFileOperations.ts";
import {readonly, ref, watch} from "vue";
import {getDefaultMindMapData, MindMapData, useMindMap} from "@/mindMap/useMindMap.ts";
import {validateMindMapData} from "@/mindMap/clipBoard/inputParse.ts";
import {jsonSortPropStringify} from "@/json/jsonStringify.ts";
import {sendMessage} from "@/message/sendMessage.ts";
import type {JSONSchemaType} from "ajv/lib/types/json-schema.ts";
import {createSchemaValidator} from "@/type/typeGuard.ts";

const metaFileName = '[[WAVE_CLEAN_EDIT_META]]'

type Meta = {
    currentKey?: string | undefined,
    mindMaps: {
        key: string,
        name: string,
        lastEditTime: string
    }[]
}

const Meta_JsonSchema: JSONSchemaType<Meta> = {
    type: "object",
    properties: {
        currentKey: {
            type: "string",
            nullable: true
        },
        mindMaps: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    key: {
                        type: "string",
                    },
                    name: {
                        type: "string",
                    },
                    lastEditTime: {
                        type: "string",
                    },
                },
                required: ["key", "name", "lastEditTime"],
            },
        },
    },
    required: ["mindMaps"],
}

const validateMeta = createSchemaValidator<Meta>(Meta_JsonSchema)

const initMindMapFileStore = () => {
    const meta = ref<Meta>({mindMaps: []})

    const mindMapStore = useMindMap()

    watch(() => meta.value, async () => {
        await jsonFileOperations.set(metaFileName, JSON.stringify(meta.value))
    }, {deep: true})

    const add = async (index: number, name: string) => {
        try {
            const timestamp = new Date()
            const key = name + Date.now()
            meta.value.mindMaps.splice(index, 0, {key, name, lastEditTime: timestamp.toLocaleString()})
            await jsonFileOperations.create(key)
            await jsonFileOperations.set(key, jsonSortPropStringify(getDefaultMindMapData()))
            return key
        } catch (e) {
            sendMessage("create mindmap fail")
            throw e
        }
    }

    const rename = async (key: string, newName: string) => {
        for (const it of meta.value.mindMaps) {
            if (it.key === key) {
                it.name = newName
            }
        }
    }

    const remove = async (key: string) => {
        try {
            meta.value.mindMaps = meta.value.mindMaps.filter(item => item.key !== key)
            await jsonFileOperations.remove(key)
        } catch (e) {
            sendMessage("delete mindmap fail")
            throw e
        }
    }

    const get = async (key: string): Promise<MindMapData> => {
        const item = meta.value.mindMaps.find(it => it.key === key)
        if (item === undefined) {
            sendMessage(`toggle error, MindMap not existed.`)
            throw new Error(`mindMap ${key} not existed`)
        }
        const data = await jsonFileOperations.get(key)
        if (data === undefined) {
            sendMessage(`toggle error, MindMap not existed.`)
            throw new Error(`mindMap ${key} file not existed`)
        }
        const parsedData = JSON.parse(data)
        if (!validateMindMapData(parsedData)) {
            sendMessage(`toggle error, MindMap illegal.`)
            throw new Error(`invalid mindMap ${key}`)
        }
        return parsedData
    }

    const save = async (key: string | undefined = meta.value.currentKey) => {
        if (key !== undefined) {
            try {
                await jsonFileOperations.set(key, JSON.stringify(mindMapStore.export()))
                sendMessage("save success")
            } catch (e) {
                console.error(e)
                sendMessage(`save fail: ${e}`)
            }
        } else {
            sendMessage("please create a new mindMap")
        }
    }

    const toggle = async (key: string) => {
        const item = meta.value.mindMaps.find(it => it.key === key)
        if (item === undefined) {
            sendMessage(`toggle error, MindMap not existed.`)
            return
        }
        if (meta.value.currentKey !== undefined) {
            const mindMap = await get(key)
            await mindMapStore.set(mindMap)
        }
        meta.value.currentKey = key
    }

    (async () => {
        try {
            const isExisted = await jsonFileOperations.isExisted(metaFileName)
            if (!isExisted) {
                await jsonFileOperations.create(metaFileName)
                await jsonFileOperations.set(metaFileName, JSON.stringify(meta.value))
            }
            const metaValueStr = await jsonFileOperations.get(metaFileName)

            let metaValue: Meta | undefined
            try {
                metaValue = JSON.parse(metaValueStr)
            } catch (e) {
                await jsonFileOperations.set(metaFileName, JSON.stringify(meta.value))
                metaValue = meta.value
            }
            if (validateMeta(metaValue)) {
                meta.value = metaValue
            } else {
                await jsonFileOperations.set(metaFileName, JSON.stringify(meta.value))
            }
            if (meta.value.currentKey && meta.value.mindMaps.findIndex(it => it.key === meta.value.currentKey) !== -1) {
                await toggle(meta.value.currentKey)
            } else {
                const key = await add(0, "default")
                await toggle(key)
            }
        } catch (e) {
            console.error(e)
            sendMessage("meta file init fail")
        }
    })()

    return {
        meta: readonly(meta),
        add,
        rename,
        remove,
        save,
        toggle,
    }
}

type MindMapFileStore = ReturnType<typeof initMindMapFileStore>

let fileStore: MindMapFileStore | undefined = undefined

export const useMindMapFileStore = () => {
    if (fileStore === undefined) {
        fileStore = initMindMapFileStore()
    }
    return fileStore
}
