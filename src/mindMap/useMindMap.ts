import {
    Connection,
    GraphEdge,
    GraphNode,
    Rect,
    useVueFlow,
    ViewportTransform,
    VueFlowStore,
    XYPosition,
} from "@vue-flow/core";
import {
    computed,
    nextTick,
    readonly,
    ref,
    ShallowReactive,
    shallowReactive,
    ShallowRef,
    shallowRef,
    toRaw,
} from "vue";
import {blurActiveElement, judgeTargetIsInteraction} from "@/utils/event/judgeEventTarget.ts";
import {jsonSortPropStringify} from "@/utils/json/jsonStringify.ts";
import {
    JustifyOptions,
    MindMapImportData,
    prepareImportIntoMindMap,
    validateMindMapImportData
} from "@/mindMap/import/import.ts";
import {
    ExportFileType,
    exportMindMapData,
    exportMindMapSelectionData,
    exportMindMapToFile,
    MindMapExportData
} from "@/mindMap/export/export.ts";
import {MindMapData} from "@/mindMap/MindMapData.ts";
import {checkFullConnection, FullConnection, reverseConnection} from "@/mindMap/edge/connection.ts";
import {useMindMapHistory} from "@/mindMap/history/MindMapHistory.ts";
import {unimplementedClipBoard, useClipBoard} from "@/utils/clipBoard/useClipBoard.ts";
import {useMindMapMetaStore} from "@/mindMap/meta/MindMapMetaStore.ts";
import {LazyData} from "@/utils/type/lazyDataParse.ts";
import {useDeviceStore} from "@/store/deviceStore.ts";
import {v7 as uuid} from "uuid"
import {sendMessage} from "@/components/message/sendMessage.ts";
import {getTouchRect} from "@/utils/event/getTouchRect.ts";
import {createStore} from "@/store/createStore.ts";
import {withLoading} from "@/components/loading/loadingApi.ts";
import {
    MindMapLayer,
    MindMapLayerData,
    MindMapLayerDiffData,
    MindMapLayerDiffDataKeys
} from "@/mindMap/layer/MindMapLayer.ts";
import {ContentNodeData, ContentType_DEFAULT, NodeType_CONTENT} from "@/mindMap/node/ContentNode.ts";
import {ContentEdgeData, EdgeType_CONTENT} from "@/mindMap/edge/ContentEdge.ts";

// 鼠标默认行为
type MouseAction = "panDrag" | "selectionRect"

export const createLayerId = () => {
    return `layer-${uuid()}`
}

export const createNodeId = () => {
    return `node-${uuid()}`
}

export const createVueFlowId = () => {
    return `vueflow-${uuid()}`
}

export const createEdgeId = (connection: Connection) => {
    return `vueflow__edge-${connection.source}${connection.sourceHandle ?? ''}-${connection.target}${connection.targetHandle ?? ''}`
}

export const getDefaultMindMapData = (): MindMapData => {
    const id = createLayerId()
    return {
        currentLayerId: id,
        layers: [
            {
                id,
                name: "layer-0",
                visible: true,
                opacity: 1,
                data: {
                    nodes: [],
                    edges: [],
                }
            }
        ],
        transform: {
            x: 0,
            y: 0,
            zoom: 1,
        },
        zIndexIncrement: 1,
    }
}

export const createLayer = (id: string, name: string) => {
    const vueFlowId = createVueFlowId()
    return shallowReactive({
        id,
        vueFlow: useVueFlow(vueFlowId),
        name,
        visible: true,
        opacity: 1,

        ...unimplementedClipBoard,
    })
}

// 将 MindMapData 中的静态图层数据转换为真实的响应式图层
const layerDataToLayers = (
    data: {
        currentLayerId: string,
        layers: MindMapLayerData[],
    }
): {
    layers: ShallowReactive<MindMapLayer[]>,
    currentLayer: ShallowReactive<MindMapLayer>
} => {
    const currentLayerIndex = data.layers.findIndex(layer => layer.id === data.currentLayerId)
    if (currentLayerIndex === -1) {
        throw new Error("current layer does not in layers")
    }
    const layerIdSet = new Set(data.layers.map(it => it.id))
    if (layerIdSet.size !== data.layers.length) {
        throw new Error("layers id is not unique")
    }
    const layers = shallowReactive(data.layers.map(it => {
        const {id, name, data, ...other} = it
        const layer = createLayer(id, name)
        Object.assign(layer, other)
        layer.vueFlow.setNodes(data.nodes)
        layer.vueFlow.setEdges(data.edges)
        return layer
    }))
    const currentLayer = layers[currentLayerIndex]

    return {
        layers,
        currentLayer
    }
}

// 思维导图全局变量类型，对外暴露 zIndex自增、图层状态与图层切换API
export type MindMapGlobal = {
    zIndexIncrement: number,
    layers: ShallowReactive<MindMapLayer[]>,
    currentLayer: ShallowRef<ShallowReactive<MindMapLayer>>,
    toggleCurrentLayer: (layerId: string) => void,
}

export const useMindMap = createStore((data: MindMapData = getDefaultMindMapData()) => {
    const {isTouchDevice} = useDeviceStore()

    const {currentLayer, layers} = layerDataToLayers(data)

    const global: MindMapGlobal = {
        zIndexIncrement: data.zIndexIncrement,
        layers: layers,
        currentLayer: shallowRef<MindMapLayer>(currentLayer),

        toggleCurrentLayer: async (layerId: string) => {
            const targetLayer = global.layers.find(layer => layer.id === layerId)
            if (targetLayer === undefined) throw new Error(`layer [${layerId}] is undefined`)

            blurActiveElement()
            cleanSelection()
            global.currentLayer.value = targetLayer
            await nextTick()
            setLayerConfigDefault()
            focus()
        }
    }

    const screenPosition = ref<XYPosition>({x: 0, y: 0})

    const {history, canUndo, canRedo} = useMindMapHistory(global)

    const currentLayerId = computed(() => global.currentLayer.value.id)
    const getCurrentVueFlow = () => {
        return global.currentLayer.value.vueFlow
    }

    const getSelection = () => {
        const vueFlow = getCurrentVueFlow()
        return {
            nodes: vueFlow.getSelectedNodes.value,
            edges: vueFlow.getSelectedEdges.value,
        }
    }

    const cleanSelection = () => {
        const vueFlow = getCurrentVueFlow()
        vueFlow.removeSelectedNodes(vueFlow.getSelectedNodes.value)
        vueFlow.removeSelectedEdges(vueFlow.getSelectedEdges.value)
    }
    const focus = () => {
        const vueFlow = getCurrentVueFlow()
        vueFlow.vueFlowRef.value?.focus()
    }

    const currentViewport = shallowRef<ViewportTransform>(global.currentLayer.value.vueFlow.viewport.value)

    const addLayer = () => {
        history.executeBatch(Symbol("layer:add"), () => {
            const id = createLayerId()

            let increment = global.layers.length
            let name = `layer-${increment}`
            const layerNameSet = new Set(global.layers.map(it => it.name))
            while (layerNameSet.has(name)) {
                name = `layer-${++increment}`
            }
            const layer = createLayer(id, name)
            history.executeCommand("layer:add", layer)
            toggleLayer(layer.id)
        })
    }

    const removeLayer = (layerId: string) => {
        if (global.layers.length <= 1) return
        history.executeBatch(Symbol("layer:remove"), () => {
            const layer = global.layers.find(layer => layer.id === layerId)
            if (layer === undefined) {
                console.error(`layer ${layerId} not exist`)
                return
            }
            if (layerId === currentLayerId.value) {
                const currentIndex = global.layers.findIndex(layer => layer.id === currentLayerId.value)
                if (currentIndex === -1) {
                    console.error("current layer not in layers")
                    return
                }
                if (currentIndex === 0) {
                    toggleLayer(global.layers[1].id)
                } else {
                    toggleLayer(global.layers[currentIndex - 1].id)
                }
            }
            history.executeCommand("layer:remove", layerId)
        })
    }

    const toggleLayer = (layerId: string) => {
        if (layerId === global.currentLayer.value.id) return
        const layer = global.layers.find(layer => layer.id === layerId)
        if (layer === undefined) {
            console.error(`layer ${layerId} not exist`)
            return
        }
        history.executeCommand("layer:toggle", layerId)
    }

    const changeLayerVisible = (layerId: string, visible: boolean) => {
        const layer = global.layers.find(layer => layer.id === layerId)
        if (layer === undefined) {
            console.error(`layer ${layerId} not exist`)
            return
        }
        if (layer.visible === visible) return
        history.executeCommand("layer:visible:change", {layerId, visible})
    }

    const changeLayerData = (layerId: string, data: Partial<MindMapLayerDiffData>) => {
        const layer = global.layers.find(layer => layer.id === layerId)
        if (layer === undefined) {
            console.error(`layer ${layerId} not exist`)
            return
        }
        let equalFlag = true
        for (const key of MindMapLayerDiffDataKeys) {
            if (layer[key] !== data[key]) {
                equalFlag = false
                break
            }
        }
        if (equalFlag) return
        history.executeCommand("layer:data:change", {layerId, newData: data})
    }

    const dragLayer = (oldIndex: number, newIndex: number) => {
        if (
            oldIndex < 0 || oldIndex > global.layers.length + 1 ||
            newIndex < 0 || newIndex > global.layers.length + 1 ||
            newIndex === oldIndex
        ) return
        history.executeCommand("layer:dragged", {oldIndex, newIndex})
    }

    const swapLayer = (oldIndex: number, newIndex: number) => {
        if (
            oldIndex < 0 || oldIndex > global.layers.length ||
            newIndex < 0 || newIndex > global.layers.length ||
            newIndex === oldIndex
        ) return
        history.executeCommand("layer:swapped", {oldIndex, newIndex})
    }

    const addNode = (position: XYPosition, layerId: string = currentLayerId.value) => {
        return history.executeCommand("node:add", {
            layerId,
            node: {
                id: createNodeId(),
                position,
                type: NodeType_CONTENT,
                data: {
                    content: "",
                    type: ContentType_DEFAULT,
                },
            }
        })
    }

    const checkConnectionExist = (connection: Connection): boolean => {
        const vueFlow = getCurrentVueFlow()
        return vueFlow.findEdge(createEdgeId(connection)) !== undefined ||
            vueFlow.findEdge(createEdgeId(reverseConnection(connection))) !== undefined
    }

    const addEdge = (connection: Connection, layerId: string = currentLayerId.value) => {
        if (checkConnectionExist(connection)) return
        if (!checkFullConnection(connection)) return

        const id = createEdgeId(connection)

        history.executeCommand('edge:add', {
            layerId,
            edge: {
                ...connection,
                id,
                type: EdgeType_CONTENT,
                data: {
                    content: ""
                },
            }
        })
    }


    const getCenterPosition = () => {
        const vueFlow = getCurrentVueFlow()
        return vueFlow.screenToFlowCoordinate({x: window.innerWidth / 2, y: window.innerHeight / 2})
    }

    const importData = (
        data: MindMapImportData,
        justifyOptions: JustifyOptions = {
            point: getCenterPosition(),
            type: "leftTop"
        },
        vueFlow = getCurrentVueFlow()
    ) => {
        blurActiveElement()
        const {newNodes, newEdges} = prepareImportIntoMindMap(vueFlow, data, justifyOptions)
        history.executeCommand("import", {layerId: currentLayerId.value, nodes: newNodes, edges: newEdges})

        const currentMultiSelectionActive = vueFlow.multiSelectionActive.value
        vueFlow.multiSelectionActive.value = true
        cleanSelection()
        const graphNodes = newNodes.map(it => vueFlow.findNode(it.id)).filter(it => it !== undefined)
        const graphEdges = newEdges.map(it => vueFlow.findEdge(it.id)).filter(it => it !== undefined)
        vueFlow.addSelectedNodes(graphNodes)
        vueFlow.addSelectedEdges(graphEdges)
        vueFlow.multiSelectionActive.value = currentMultiSelectionActive
    }


    const remove = (data: { nodes?: (GraphNode | string)[], edges?: (GraphEdge | string)[] }) => {
        const vueFlow = getCurrentVueFlow()

        blurActiveElement()
        history.executeCommand('remove', {...data, layerId: currentLayerId.value})
        focus()
        vueFlow.vueFlowRef.value?.addEventListener('blur', () => {
            focus()
        }, {once: true})
    }

    const removeSelection = () => {
        remove(getSelection())
    }

    /**
     * 点击多选相关配置
     */
    const isSelectionNotEmpty = computed(() => {
        const vueFlow = getCurrentVueFlow()
        return (vueFlow.getSelectedNodes.value.length + vueFlow.getSelectedEdges.value.length) > 0
    })
    const isSelectionPlural = computed(() => {
        const vueFlow = getCurrentVueFlow()
        return (vueFlow.getSelectedNodes.value.length + vueFlow.getSelectedEdges.value.length) > 1
    })
    const canMultiSelect = computed(() => {
        const vueFlow = getCurrentVueFlow()
        return vueFlow.multiSelectionActive.value
    })
    const enableMultiSelect = (vueFlow: VueFlowStore = getCurrentVueFlow()) => {
        vueFlow.multiSelectionActive.value = true
    }
    const disableMultiSelect = (vueFlow: VueFlowStore = getCurrentVueFlow()) => {
        vueFlow.multiSelectionActive.value = false
    }
    const toggleMultiSelect = (vueFlow: VueFlowStore = getCurrentVueFlow()) => {
        if (vueFlow.multiSelectionActive.value) {
            disableMultiSelect(vueFlow)
        } else {
            enableMultiSelect(vueFlow)
        }
    }

    const selectAll = (vueFlow: VueFlowStore = getCurrentVueFlow()) => {
        const isCurrentMultiSelect = vueFlow.multiSelectionActive.value

        if (!isCurrentMultiSelect) enableMultiSelect(vueFlow)
        if (vueFlow.getSelectedNodes.value.length < vueFlow.getNodes.value.length) {
            vueFlow.addSelectedNodes(vueFlow.getNodes.value)
        }
        if (vueFlow.getSelectedEdges.value.length < vueFlow.getEdges.value.length) {
            vueFlow.addSelectedEdges(vueFlow.getEdges.value)
        }
        if (!isCurrentMultiSelect) disableMultiSelect(vueFlow)
    }

    const toggleSelectAll = (vueFlow: VueFlowStore = getCurrentVueFlow()) => {
        const isCurrentMultiSelect = vueFlow.multiSelectionActive.value

        if (!isCurrentMultiSelect) enableMultiSelect(vueFlow)
        if (vueFlow.getSelectedNodes.value.length < vueFlow.getNodes.value.length || vueFlow.getSelectedEdges.value.length < vueFlow.getEdges.value.length) {
            vueFlow.addSelectedNodes(vueFlow.getNodes.value)
            vueFlow.addSelectedEdges(vueFlow.getEdges.value)
        } else {
            vueFlow.removeSelectedNodes(vueFlow.getNodes.value)
            vueFlow.removeSelectedEdges(vueFlow.getEdges.value)
        }
        if (!isCurrentMultiSelect) disableMultiSelect(vueFlow)
    }

    /**
     * 框选相关配置
     */
    let selectionRectEnable: boolean = false
    let selectionRectMouseButton: number = 0

    const getByClientRect = (
        rect: {
            readonly x: number,
            readonly y: number,
            readonly width: number,
            readonly height: number
        },
        vueFlow: VueFlowStore = getCurrentVueFlow()
    ) => {
        const innerNodes: GraphNode[] = []
        const innerEdges: GraphEdge[] = []

        const leftTop = vueFlow.screenToFlowCoordinate({x: rect.x, y: rect.y})
        const rightBottom = vueFlow.screenToFlowCoordinate({x: rect.x + rect.width, y: rect.y + rect.height})

        for (const node of vueFlow.getNodes.value) {
            const nodeLeft = node.position.x
            const nodeRight = node.position.x + node.dimensions.width
            const nodeTop = node.position.y
            const nodeBottom = node.position.y + node.dimensions.height

            if (
                nodeRight > leftTop.x &&
                nodeLeft < rightBottom.x &&
                nodeBottom > leftTop.y &&
                nodeTop < rightBottom.y
            ) {
                innerNodes.push(node);
            }
        }

        for (const edge of vueFlow.getEdges.value) {
            if (
                edge.sourceX > leftTop.x &&
                edge.sourceX < rightBottom.x &&
                edge.sourceY > leftTop.y &&
                edge.sourceY < rightBottom.y &&
                edge.targetX > leftTop.x &&
                edge.targetX < rightBottom.x &&
                edge.targetY > leftTop.y &&
                edge.targetY < rightBottom.y
            ) {
                innerEdges.push(edge);
            }
        }

        return {nodes: innerNodes, edges: innerEdges}
    }


    /**
     * 同步边连接信息
     */
    const isConnecting = ref(false)
    const connectSourceNodeId = ref<string>()

    /**
     * 默认鼠标行为
     */
    const defaultMouseAction = ref<MouseAction>('panDrag')

    // 默认操作为拖拽
    const setDefaultPanDrag = (
        vueFlow: VueFlowStore = getCurrentVueFlow()
    ) => {
        defaultMouseAction.value = 'panDrag'
        vueFlow.panOnDrag.value = isTouchDevice.value ? true : [0, 2]
        selectionRectMouseButton = 2
        selectionRectEnable = false
        focus()
    }
    // 默认操作为框选，通过鼠标右键拖拽
    const setDefaultSelectionRect = (
        vueFlow: VueFlowStore = getCurrentVueFlow()
    ) => {
        defaultMouseAction.value = 'selectionRect'
        vueFlow.panOnDrag.value = isTouchDevice.value ? false : [2]
        selectionRectMouseButton = 0
        selectionRectEnable = true
        focus()
    }
    const toggleDefaultMouseAction = (
        vueFlow: VueFlowStore = getCurrentVueFlow()
    ) => {
        if (defaultMouseAction.value === 'panDrag') {
            setDefaultSelectionRect(vueFlow)
        } else {
            setDefaultPanDrag(vueFlow)
        }
    }

    const canDrag = computed(() => {
        const vueFlow = getCurrentVueFlow()
        return vueFlow.nodesDraggable.value
    })
    const disableDrag = (
        vueFlow: VueFlowStore = getCurrentVueFlow()
    ) => {
        vueFlow.nodesDraggable.value = false
    }
    const enableDrag = (
        vueFlow: VueFlowStore = getCurrentVueFlow()
    ) => {
        vueFlow.nodesDraggable.value = true
    }

    const setLayerConfigDefault = (
        vueFlow: VueFlowStore = getCurrentVueFlow()
    ) => {
        disableMultiSelect(vueFlow)
        setDefaultPanDrag(vueFlow)
        enableDrag(vueFlow)
    }

    setLayerConfigDefault()

    const initLayer = (layer: MindMapLayer) => {
        const {id, vueFlow} = layer

        setLayerConfigDefault(vueFlow)

        const {
            vueFlowRef,
            onInit,

            screenToFlowCoordinate,

            onViewportChange,

            onNodesChange,
            onNodeDragStart,
            onNodeDragStop,
            onConnect,
            onConnectStart,
            onConnectEnd,
            onEdgeUpdateStart,
            onEdgeUpdate,

            getSelectedNodes,
            getSelectedEdges,
        } = vueFlow

        onInit(() => {
            const el = vueFlowRef.value
            const viewportEl = vueFlowRef.value
            const paneEl = el?.querySelector('div.vue-flow__pane') as HTMLDivElement | null

            if (el === null || viewportEl === null || paneEl === null) {
                throw new Error(`Layer [${id}] Ref is undefined in onInit`)
            }

            /**
             * 同步视口
             */
            vueFlow.setViewport(currentViewport.value).then()

            onViewportChange(async () => {
                if (id === currentLayerId.value) {
                    currentViewport.value = toRaw(vueFlow.viewport.value)
                    await nextTick()
                    for (const layer of global.layers) {
                        if (layer.id === id) continue
                        await layer.vueFlow.setViewport(currentViewport.value)
                    }
                }
            })

            /**
             * 剪切板
             */
            const clipBoard = useClipBoard<MindMapImportData, MindMapExportData>({
                exportData: (): MindMapExportData => {
                    return exportMindMapSelectionData(vueFlow)
                },
                importData: (data: MindMapImportData) => {
                    importData(data, {point: screenToFlowCoordinate(screenPosition.value), type: "topNode"})
                },
                removeData: (data: MindMapExportData) => {
                    remove({nodes: data.nodes?.map(it => it.id), edges: data.edges?.map(it => it.id)})
                },
                stringifyData: (data: MindMapExportData): string => {
                    return jsonSortPropStringify(data)
                },
                validateInput: validateMindMapImportData
            })

            Object.assign(layer, clipBoard)

            /**
             * 节点移动
             */
            const nodeMoveMap = new Map<string, XYPosition>

            onNodesChange((changes) => {
                if (nodeMoveMap.size !== 0) return

                history.executeBatch(Symbol("node:move"), () => {
                    for (const change of changes) {
                        if (change.type === 'position') {
                            history.pushCommand('node:move', {
                                layerId: currentLayerId.value,
                                id: change.id,
                                oldPosition: change.from,
                                newPosition: change.position
                            }, {
                                layerId: currentLayerId.value,
                                id: change.id,
                                oldPosition: change.from,
                            })
                        }
                    }
                })
            })

            onNodeDragStart(({nodes}) => {
                nodeMoveMap.clear()
                for (const node of nodes) {
                    nodeMoveMap.set(node.id, node.position)
                }
            })

            onNodeDragStop(({nodes}) => {
                history.executeBatch(Symbol("node:move"), () => {
                    for (const node of nodes) {
                        const oldPosition = nodeMoveMap.get(node.id)
                        nodeMoveMap.delete(node.id)
                        if (oldPosition !== undefined) {
                            const newPosition = node.position
                            if (jsonSortPropStringify(oldPosition) !== jsonSortPropStringify(newPosition)) {
                                history.executeCommand('node:move', {
                                    layerId: currentLayerId.value,
                                    id: node.id,
                                    newPosition,
                                    oldPosition
                                })
                            }
                        }
                    }
                })
                nodeMoveMap.clear()
            })

            /**
             * 边连接
             */
            onConnect((connectData) => {
                addEdge(connectData)
            })

            onConnectStart((data) => {
                isConnecting.value = true
                connectSourceNodeId.value = data.nodeId
            })

            onConnectEnd(() => {
                isConnecting.value = false
                connectSourceNodeId.value = undefined
            })

            /**
             * 边重连接
             */
            const edgeReconnectMap = new Map<string, FullConnection>
            const stopSelectStart = (e: Event) => {
                e.preventDefault()
            }

            onEdgeUpdateStart(({edge}) => {
                vueFlowRef.value?.addEventListener('selectstart', stopSelectStart)
                const connection: Connection = {
                    source: edge.source,
                    sourceHandle: edge.sourceHandle,
                    target: edge.target,
                    targetHandle: edge.targetHandle,
                }
                if (checkFullConnection(connection)) {
                    edgeReconnectMap.set(edge.id, connection)
                }
            })

            onEdgeUpdate(({edge, connection}) => {
                history.executeBatch(Symbol("edge:reconnect"), () => {
                    const oldConnection = edgeReconnectMap.get(edge.id)
                    edgeReconnectMap.delete(edge.id)
                    if (oldConnection !== undefined && checkFullConnection(connection)) {
                        if (jsonSortPropStringify(oldConnection) !== jsonSortPropStringify(connection) && !checkConnectionExist(connection)) {
                            history.executeCommand('edge:reconnect', {
                                layerId: currentLayerId.value,
                                id: edge.id,
                                newConnection: connection,
                                oldConnection
                            })
                        }
                    }
                })
                vueFlowRef.value?.removeEventListener('selectstart', stopSelectStart)
            })

            /**
             * 键盘事件监听
             */
            el.addEventListener('keydown', (e) => {
                // 按下 Delete 键删除选中的节点和边
                if (e.key === "Delete") {
                    if (getSelectedNodes.value.length === 0 && getSelectedEdges.value.length === 0) return

                    e.preventDefault()

                    remove({nodes: getSelectedNodes.value, edges: getSelectedEdges.value})
                }

                // 按下 Ctrl 键进入多选模式，直到松开 Ctrl 键
                else if (e.key === "Control") {
                    enableMultiSelect(vueFlow)
                    document.documentElement.addEventListener('keyup', (e) => {
                        if (e.key === "Control" || e.ctrlKey) {
                            disableMultiSelect(vueFlow)
                        }
                    }, {once: true})
                } else if (e.key === "Shift") {
                    if (judgeTargetIsInteraction(e)) return

                    toggleDefaultMouseAction(vueFlow)
                    document.documentElement.addEventListener('keyup', (e) => {
                        if (e.key === "Shift" || e.shiftKey) {
                            toggleDefaultMouseAction(vueFlow)
                        }
                    }, {once: true})
                } else if (e.ctrlKey) {
                    // 按下 Ctrl + a 键，全选
                    if (e.key === "a" || e.key === "A") {
                        if (judgeTargetIsInteraction(e)) return

                        e.preventDefault()

                        selectAll()
                    }
                }
            })

            if (!isTouchDevice.value) {
                // 设置屏幕位置
                paneEl.addEventListener('mouseenter', (e) => {
                    screenPosition.value = {x: e.clientX, y: e.clientY}
                })
                paneEl.addEventListener('mousemove', (e) => {
                    screenPosition.value = {x: e.clientX, y: e.clientY}
                })

                // 双击添加节点
                let waitNextMouseDown = false
                let waitTimeout: number | undefined
                // 记录上一次 mousedown 以避免误触
                let lastMouseTime = new Date().getTime()
                let lastMousePosition: XYPosition | null = null

                paneEl.addEventListener('mousedown', (e) => {
                    if (e.target !== paneEl) return
                    if (!layer.visible) return

                    const currentTime = new Date().getTime()
                    const currentMousePosition = {x: e.clientX, y: e.clientY}

                    if (waitNextMouseDown) {
                        waitNextMouseDown = false
                        clearTimeout(waitTimeout)

                        const timeDiff = currentTime - lastMouseTime
                        if (timeDiff > 0 && timeDiff < 300 && lastMousePosition !== null) {
                            if (
                                Math.abs(currentMousePosition.x - lastMousePosition.x) < 10 &&
                                Math.abs(currentMousePosition.y - lastMousePosition.y) < 10
                            ) {
                                addNode(screenToFlowCoordinate(currentMousePosition))
                            }
                        }

                        lastMousePosition = null
                    } else {
                        waitNextMouseDown = true
                        waitTimeout = setTimeout(() => {
                            waitNextMouseDown = false
                            lastMousePosition = null
                        }, 300)

                        lastMouseTime = currentTime
                        lastMousePosition = currentMousePosition
                    }
                })

                // 鼠标移入非交互元素时，允许拖拽，否则禁止画布拖拽
                let currentPanOnDrag = vueFlow.panOnDrag.value
                paneEl.addEventListener('mouseover', (e) => {
                    if (vueFlow.panOnDrag.value !== false && judgeTargetIsInteraction(e)) {
                        currentPanOnDrag = vueFlow.panOnDrag.value
                        vueFlow.panOnDrag.value = false
                    } else if (currentPanOnDrag !== false) {
                        vueFlow.panOnDrag.value = currentPanOnDrag
                    }
                })

                // 多选框
                paneEl.addEventListener('mousedown', (e) => {
                    if (e.target !== paneEl) return
                    if (!selectionRectEnable) return
                    if (e.button !== selectionRectMouseButton) return

                    e.preventDefault()
                    blurActiveElement()

                    vueFlow.multiSelectionActive.value = true
                    vueFlow.userSelectionActive.value = true
                    cleanSelection()

                    const start = {x: e.clientX, y: e.clientY}

                    const onRectSelect = (e: MouseEvent) => {
                        e.preventDefault()
                        const current = {x: e.clientX, y: e.clientY}
                        let width = current.x - start.x
                        let height = current.y - start.y
                        const x = width > 0 ? start.x : current.x
                        const y = height > 0 ? start.y : current.y
                        width = width > 0 ? width : -width
                        height = height > 0 ? height : -height

                        const rect = {
                            width,
                            height,
                            x,
                            y,
                            startX: start.x,
                            startY: start.y,
                        }
                        vueFlow.userSelectionRect.value = rect

                        const {nodes, edges} = getByClientRect(rect)

                        cleanSelection()
                        vueFlow.addSelectedNodes(nodes)
                        vueFlow.addSelectedEdges(edges)
                    }

                    const onRectSelectEnd = () => {
                        document.documentElement.removeEventListener('mousemove', onRectSelect)
                        document.documentElement.removeEventListener('mouseup', onRectSelectEnd)

                        vueFlow.userSelectionActive.value = false
                        vueFlow.userSelectionRect.value = null

                        const newSelectedNodes = vueFlow.getSelectedNodes.value
                        const newSelectedEdges = vueFlow.getSelectedEdges.value
                        setTimeout(() => {
                            cleanSelection()
                            vueFlow.addSelectedNodes(newSelectedNodes)
                            vueFlow.addSelectedEdges(newSelectedEdges)
                            vueFlow.multiSelectionActive.value = false
                        })
                    }

                    document.documentElement.addEventListener('mousemove', onRectSelect)
                    document.documentElement.addEventListener('mouseup', onRectSelectEnd)
                })
            } else {
                // 设置屏幕位置
                paneEl.addEventListener('touchstart', (e) => {
                    screenPosition.value = {x: e.touches[0].clientX, y: e.touches[0].clientY}
                })
                paneEl.addEventListener('touchmove', (e) => {
                    if (e.changedTouches.length > 0) {
                        screenPosition.value = {x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY}
                    }
                })

                // 当触碰数量多于，阻止节点拖拽
                el.addEventListener('touchstart', (e) => {
                    if (e.touches.length > 1) {
                        disableDrag()
                    } else {
                        enableDrag()
                    }
                }, {capture: true})

                // 双击添加节点
                let waitNextTouchEnd = false
                let waitTimeout: number | undefined
                // 记录上一次 touchstart 以避免误触
                let lastTouchTime = new Date().getTime()
                let lastTouchPosition: XYPosition | null = null

                paneEl.addEventListener('touchstart', (e) => {
                    if (e.target !== paneEl) return
                    if (!layer.visible) return

                    const currentTime = new Date().getTime()
                    const currentTouchPosition = {x: e.touches[0].clientX, y: e.touches[0].clientY}

                    if (waitNextTouchEnd) {
                        waitNextTouchEnd = false
                        clearTimeout(waitTimeout)

                        const timeDiff = currentTime - lastTouchTime
                        if (timeDiff > 0 && timeDiff < 300 && lastTouchPosition !== null) {
                            if (
                                Math.abs(currentTouchPosition.x - lastTouchPosition.x) < 60 &&
                                Math.abs(currentTouchPosition.y - lastTouchPosition.y) < 60
                            ) {
                                addNode(screenToFlowCoordinate(currentTouchPosition))
                            }

                            e.stopPropagation()
                        }

                        lastTouchPosition = null
                    } else {
                        lastTouchTime = currentTime
                        lastTouchPosition = currentTouchPosition
                    }
                })
                paneEl.addEventListener('touchend', (e) => {
                    if (e.target !== paneEl) return
                    if (!waitNextTouchEnd) {
                        waitNextTouchEnd = true
                        waitTimeout = setTimeout(() => {
                            waitNextTouchEnd = false
                            lastTouchPosition = null
                        }, 150)
                    }
                })

                // 多选框
                paneEl.addEventListener('touchstart', (e) => {
                    if (e.target !== paneEl) return
                    if (!selectionRectEnable) return

                    e.preventDefault()
                    blurActiveElement()

                    vueFlow.userSelectionActive.value = true
                    vueFlow.multiSelectionActive.value = true
                    cleanSelection()

                    const start = {x: e.touches[0].clientX, y: e.touches[0].clientY}

                    const onRectSelect = (e: TouchEvent) => {
                        e.preventDefault()
                        let {x, y, width, height} = getTouchRect(e, start)
                        const rect = {
                            width,
                            height,
                            x,
                            y,
                            startX: start.x,
                            startY: start.y,
                        }
                        vueFlow.userSelectionRect.value = rect

                        const {nodes, edges} = getByClientRect(rect)

                        cleanSelection()
                        vueFlow.addSelectedNodes(nodes)
                        vueFlow.addSelectedEdges(edges)
                    }

                    const onRectSelectEnd = (e: TouchEvent) => {
                        if (e.touches.length !== 0) return

                        document.documentElement.removeEventListener('touchmove', onRectSelect)
                        document.documentElement.removeEventListener('touchend', onRectSelectEnd)
                        document.documentElement.removeEventListener('touchcancel', onRectSelectEnd)

                        vueFlow.multiSelectionActive.value = false
                        vueFlow.userSelectionActive.value = false
                        vueFlow.userSelectionRect.value = null

                        if (isSelectionNotEmpty.value) {
                            setDefaultPanDrag()
                        }
                    }

                    document.documentElement.addEventListener('touchmove', onRectSelect, {passive: false})
                    document.documentElement.addEventListener('touchend', onRectSelectEnd)
                    document.documentElement.addEventListener('touchcancel', onRectSelectEnd)
                }, {passive: false})
            }
        })
    }

    const exportFileType = ref<ExportFileType>("PNG")
    const isExportFile = ref(false)

    const getMindMapData = (): MindMapData => {
        return {
            currentLayerId: currentLayerId.value,
            layers: global.layers.map(layer => ({
                id: layer.id,
                name: layer.name,
                opacity: layer.opacity,
                visible: layer.visible,
                data: exportMindMapData(layer.vueFlow)
            })),
            transform: currentViewport.value,
            zIndexIncrement: global.zIndexIncrement,
        }
    }

    const exportFile = async (type: ExportFileType = exportFileType.value) => {
        if (isExportFile.value) {
            sendMessage("downloading now, please wait")
            return
        }

        isExportFile.value = true

        try {
            await withLoading("Export MindMap", async () => {
                const savePath = await exportMindMapToFile(
                    useMindMapMetaStore().currentMindMap.value?.name,
                    getMindMapData(),
                    global.layers,
                    type
                )

                if (!savePath) {
                    sendMessage("Export MindMap Fail", {type: "error"})
                } else {
                    sendMessage(`Export MindMap Success, \nFile in ${savePath}`, {type: "success"})
                }
            })
        } finally {
            isExportFile.value = false
        }
    }

    return {
        layers: global.layers,
        currentLayer: global.currentLayer,
        initLayer,

        addLayer,
        removeLayer,
        toggleLayer,
        changeLayerVisible,
        changeLayerData,
        dragLayer,
        swapLayer,

        focus,

        currentViewport: readonly(currentViewport),

        canUndo: readonly(canUndo),
        canRedo: readonly(canRedo),
        undo: () => {
            if (canUndo.value) {
                history.undo()
                sendMessage("undo", {type: "success"})
            } else {
                sendMessage("cannot undo", {type: "warning"})
            }
            focus()
        },
        redo: () => {
            if (canRedo.value) {
                history.redo()
                sendMessage("redo", {type: "success"})
            } else {
                sendMessage("cannot redo", {type: "warning"})
            }
            focus()
        },

        executeBatch: history.executeBatch,
        executeAsyncBatch: history.executeAsyncBatch,

        getSelection,
        removeSelection,
        remove,

        fitView: (layer: MindMapLayer = global.currentLayer.value) => {
            return layer.vueFlow.fitView({duration: 600, padding: 0.1})
        },
        fitRect: (rect: Rect, layer: MindMapLayer = global.currentLayer.value) => {
            return layer.vueFlow.fitBounds(rect, {duration: 800, padding: 0.4})
        },

        isSelectionNotEmpty,
        isSelectionPlural,
        canMultiSelect,
        disableMultiSelect,
        enableMultiSelect,
        toggleMultiSelect,

        selectAll,
        toggleSelectAll,

        defaultMouseAction: readonly(defaultMouseAction),
        toggleDefaultMouseAction,

        canDrag,
        disableDrag,
        enableDrag,

        isConnecting,
        connectSourceNodeId,

        addNode,
        findNode: (id: string, vueFlow: VueFlowStore = getCurrentVueFlow()) => {
            return vueFlow.findNode(id)
        },
        selectNode: (id: string, vueFlow: VueFlowStore = getCurrentVueFlow()) => {
            const node = vueFlow.findNode(id)
            if (node !== undefined) {
                node.zIndex = global.zIndexIncrement++
                vueFlow.addSelectedNodes([node])
            }
        },
        updateNodeData: (id: string, data: Partial<ContentNodeData>, layerId: string = currentLayerId.value) => {
            history.executeCommand('node:data:change', {layerId, id, data})
        },
        recordNodeResize: (
            id: string,
            args: {
                newSize: { width: number, height: number },
                oldSize: { width: number, height: number },
                newPosition: XYPosition,
                oldPosition: XYPosition,
            },
            layerId: string = currentLayerId.value
        ) => {
            const options = {layerId, id, ...args}
            history.pushCommand('node:resize', options, options)
        },

        addEdge,
        findEdge: (id: string, vueFlow: VueFlowStore = getCurrentVueFlow()) => {
            return vueFlow.findEdge(id)
        },
        selectEdge: (id: string, vueFlow: VueFlowStore = getCurrentVueFlow()) => {
            const edge = vueFlow.findEdge(id)
            if (edge !== undefined) {
                edge.zIndex = global.zIndexIncrement++
                vueFlow.addSelectedEdges([edge])
            }
        },
        updateEdgeData: (id: string, data: Partial<ContentEdgeData>, layerId: string = currentLayerId.value) => {
            history.executeCommand('edge:data:change', {layerId, id, data})
        },

        copy: async (
            data: LazyData<MindMapExportData> | undefined = undefined,
            layer: MindMapLayer = global.currentLayer.value,
        ) => {
            try {
                const result = await layer.copy(data)
                sendMessage("copy", {type: "success"})
                focus()
                return result
            } catch (e) {
                sendMessage("copy fail", {type: "warning"})
                throw e
            }
        },
        paste: async (layer: MindMapLayer = global.currentLayer.value) => {
            try {
                const result = await layer.paste()
                sendMessage("paste", {type: "success"})
                focus()
                return result
            } catch (e) {
                sendMessage("paste fail", {type: "warning"})
                throw e
            }
        },
        cut: async (layer: MindMapLayer = global.currentLayer.value) => {
            try {
                const result = await layer.cut()
                sendMessage("cut", {type: "success"})
                focus()
                return result
            } catch (e) {
                sendMessage("cut fail", {type: "warning"})
                throw e
            }
        },

        set: async (data: MindMapData) => {
            const {layers, currentLayer} = layerDataToLayers(data)
            global.zIndexIncrement = data.zIndexIncrement
            global.layers.splice(0, global.layers.length, ...layers)
            currentViewport.value = data.transform
            toggleLayer(currentLayer.id)
            history.clean()
        },

        exportFileType,
        getMindMapData,
        exportFile,

        save: async () => {
            await useMindMapMetaStore().save()
        },
    }
})
