import {jsonFileOperations} from "@/utils/file/JsonFileOperations.ts";
import {computed, nextTick, ref, watch} from "vue";
import {getDefaultMindMapData, useMindMap} from "@/mindMap/useMindMap.ts";
import {MindMapData, validateMindMapData} from "@/mindMap/MindMapData.ts";
import {jsonSortPropStringify} from "@/utils/json/jsonStringify.ts";
import {sendMessage} from "@/components/message/messageApi.ts";
import type {JSONSchemaType} from "ajv/lib/types/json-schema.ts";
import {createSchemaValidator} from "@/utils/type/typeGuard.ts";
import {Theme} from "@tauri-apps/api/window";
import {useThemeStore} from "@/store/themeStore.ts";
import {debounce} from "lodash-es";
import {v7 as uuid} from "uuid";
import {createStore} from "@/store/createStore.ts";
import {cleanMarkdownRenderCache} from "@/components/markdown/preview/markdownRender.ts";
import {withLoading} from "@/components/loading/loadingApi.ts";

const metaFileName = '[[WAVE_CLEAN_EDIT_META]]'

export type QuickInputItem = {
    id: string,
    label: string,
    value: string,
}

export type MindMapMetaData = {
    key: string,
    name: string,
    createdTime?: string,
    lastEditTime?: string
}

export type Meta = {
    currentKey?: string | undefined,
    mindMaps: MindMapMetaData[],

    currentTheme?: Theme | undefined,
    primaryColor?: string | undefined,
    quickInputs: QuickInputItem[],
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
                    createdTime: {
                        type: "string",
                        nullable: true
                    },
                    lastEditTime: {
                        type: "string",
                        nullable: true
                    },
                },
                required: ["key", "name"],
            },
        },
        currentTheme: {
            type: "string",
            enum: ["light", "dark"],
            nullable: true,
        },
        primaryColor: {
            type: "string",
            nullable: true,
        },
        quickInputs: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: {type: "string"},
                    label: {type: "string"},
                    value: {type: "string"}
                },
                required: ["label", "value"]
            }
        }
    },
    required: ["mindMaps", "quickInputs"],
}

export const validateMeta = createSchemaValidator<Meta>(Meta_JsonSchema)

const PartialMeta_JsonSchema: JSONSchemaType<Partial<Meta>> = {
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
                    createdTime: {
                        type: "string",
                        nullable: true
                    },
                    lastEditTime: {
                        type: "string",
                        nullable: true
                    },
                },
                required: ["key", "name"],
            },
            nullable: true,
        },
        currentTheme: {
            type: "string",
            enum: ["light", "dark"],
            nullable: true,
        },
        primaryColor: {
            type: "string",
            nullable: true,
        },
        quickInputs: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: {type: "string"},
                    label: {type: "string"},
                    value: {type: "string"}
                },
                required: ["label", "value"]
            },
            nullable: true,
        }
    },
}

export const validatePartialMeta = createSchemaValidator<Partial<Meta>>(PartialMeta_JsonSchema)

export const getDefaultMeta = () => {
    let index = -1
    return {
        mindMaps: [],
        quickInputs: [
            {id: `${index--}`, label: 'TAB', value: '    '},
            {id: `${index--}`, label: '`', value: '`'},
            {id: `${index--}`, label: '\'', value: '\''},
            {id: `${index--}`, label: '"', value: '"'},
            {id: `${index--}`, label: '-', value: '-'},
            {id: `${index--}`, label: '_', value: '_'},
            {id: `${index--}`, label: '<', value: '<'},
            {id: `${index--}`, label: '>', value: '>'},
            {id: `${index--}`, label: '(', value: '('},
            {id: `${index--}`, label: ')', value: ')'},
            {id: `${index--}`, label: '[', value: '['},
            {id: `${index--}`, label: ']', value: ']'},
            {id: `${index--}`, label: '[', value: '['},
            {id: `${index--}`, label: ']', value: ']'},
            {id: `${index--}`, label: '{', value: '{'},
            {id: `${index--}`, label: '}', value: '}'},
            {id: `${index--}`, label: '^', value: '^'},
            {id: `${index--}`, label: '/', value: '/'},
            {id: `${index--}`, label: '|', value: '|'},
            {id: `${index--}`, label: '\\', value: '\\'},
        ],
    }
}

export const useMindMapMetaStore = createStore(() => {
    const meta = ref<Meta>(getDefaultMeta())

    const mindMapStore = useMindMap()
    const themeStore = useThemeStore()
    watch(() => themeStore.theme.value, (theme) => {
        if (theme !== meta.value.currentTheme) {
            meta.value.currentTheme = theme
        }
    }, {immediate: true})
    watch(() => themeStore.primaryColor.value, (color) => {
        if (color !== meta.value.primaryColor) {
            meta.value.primaryColor = color
        }
    }, {immediate: true})

    watch(() => meta.value, debounce(async () => {
        await jsonFileOperations.set(metaFileName, JSON.stringify(meta.value))
    }, 1000), {deep: true})

    const add = async (index: number, name: string) => {
        return await withLoading("Create MindMap", async () => {
            const timestamp = `${new Date().getTime()}`
            const key = `${name}-${uuid()}`
            meta.value.mindMaps.splice(index, 0, {key, name, createdTime: timestamp, lastEditTime: timestamp})
            await jsonFileOperations.create(key)
            await jsonFileOperations.set(key, jsonSortPropStringify(getDefaultMindMapData()))
            sendMessage("Create MindMap Success", {type: "success"})
            return key
        })
    }

    const rename = async (key: string, newName: string) => {
        for (const it of meta.value.mindMaps) {
            if (it.key === key) {
                it.name = newName
            }
        }
    }

    const remove = async (key: string) => {
        await withLoading("Remove MindMap", async () => {
            meta.value.mindMaps = meta.value.mindMaps.filter(item => item.key !== key)
            await jsonFileOperations.remove(key)
            sendMessage("Remove MindMap Success", {type: "success"})
        })
    }

    const get = async (key: string): Promise<MindMapData> => {
        const item = meta.value.mindMaps.find(it => it.key === key)
        if (item === undefined) {
            sendMessage(`MindMap not existed.`, {type: "error"})
            throw new Error(`MindMap [${key}] not existed`)
        }
        const data = await jsonFileOperations.get(key)
        if (data === undefined) {
            sendMessage(`MindMap [${item.name}] file not existed.`, {type: "error"})
            throw new Error(`MindMap [${item.name} : ${key}] file not existed`)
        }
        const parsedData = JSON.parse(data)
        if (!validateMindMapData(parsedData)) {
            sendMessage(`MindMap [${item.name}] data illegal.`, {type: "error"})
            throw new Error(`MindMap [${item.name} : ${key}] data illegal.`)
        }
        return parsedData
    }

    const save = async (key: string | undefined = meta.value.currentKey) => {
        if (key === undefined) {
            sendMessage("Please create a new MindMap", {type: "warning"})
            return
        }

        await withLoading("Save MindMap", async () => {
            await jsonFileOperations.set(key, JSON.stringify(mindMapStore.getMindMapData()))
            for (const item of meta.value.mindMaps) {
                if (item.key === key) {
                    item.lastEditTime = `${new Date().getTime()}`
                }
            }
            sendMessage("Save MindMap Success", {type: "success"})
        })
    }

    const toggle = async (key: string) => {
        await withLoading("Toggle MindMap", async () => {
            cleanMarkdownRenderCache()
            const item = meta.value.mindMaps.find(it => it.key === key)
            if (item !== undefined) {
                const mindMap = await get(key)
                await mindMapStore.set(mindMap)
                meta.value.currentKey = key
            } else {
                sendMessage(`Toggle MindMap Fail, \nTarget MindMap not existed.`, {type: "error"})
                throw new Error(`MindMap [${key}] not existed.`)
            }
        })
    }

    const currentMindMap = computed<MindMapMetaData | undefined>(() => {
            return meta.value.mindMaps.find(it => it.key === meta.value.currentKey)
        })

    ;(async () => {
        await nextTick()

        await withLoading("Loading Meta", async () => {
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
            } else if (validatePartialMeta(metaValue)) {
                Object.assign(meta.value, metaValue)
                await jsonFileOperations.set(metaFileName, JSON.stringify(meta.value))
            } else {
                await jsonFileOperations.set(metaFileName, JSON.stringify(meta.value))
            }
            if (meta.value.primaryColor) {
                themeStore.setPrimaryColor(meta.value.primaryColor)
            }
            if (meta.value.currentTheme) {
                themeStore.setTheme(meta.value.currentTheme)
            }
            if (meta.value.currentKey && meta.value.mindMaps.findIndex(it => it.key === meta.value.currentKey) !== -1) {
                await toggle(meta.value.currentKey)
            } else {
                const key = await add(0, "default")
                await toggle(key)
            }
        })
    })()

    return {
        meta,
        add,
        rename,
        remove,
        save,
        toggle,
        currentMindMap,
    }
})
