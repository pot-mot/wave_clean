import {
    Connection,
    Edge,
    GraphEdge,
    GraphNode,
    Node,
    Position,
    useVueFlow,
    VueFlowStore,
    XYPosition,
} from "@vue-flow/core";
import {computed, nextTick, readonly, ref, ShallowReactive, shallowReactive, ShallowRef, shallowRef, toRaw} from "vue";
import {blurActiveElement, judgeTargetIsInteraction} from "@/mindMap/clickUtils.ts";
import {jsonSortPropStringify} from "@/json/jsonStringify.ts";
import {MindMapImportData, prepareImportIntoMindMap} from "@/mindMap/importExport/import.ts";
import {useClipBoardWithKeyboard} from "@/clipBoard/useClipBoard.ts";
import {exportMindMapSelection, MindMapExportData} from "@/mindMap/importExport/export.ts";
import {validateMindMapImportData} from "@/mindMap/clipBoard/inputParse.ts";
import {checkFullConnection, FullConnection, reverseConnection} from "@/mindMap/edge/connection.ts";
import {useMindMapHistory} from "@/mindMap/history/MindMapHistory.ts";

export const MIND_MAP_ID = "mind_map" as const

export type MindMapGlobal = {
    zIndexIncrement: number,
    layerIdIncrement: number,
    nodeIdIncrement: number,
    layers: ShallowReactive<MindMapLayer[]>,
    currentLayer: ShallowRef<MindMapLayer>,
}

export type MindMapLayer = ShallowReactive<{
    readonly id: string,
    readonly vueFlow: VueFlowStore,
    visible: boolean,
}>

export const CONTENT_NODE_TYPE = "CONTENT_NODE" as const
export type ContentNodeData = {
    content: string,
}
export type ContentNode = Pick<Node, 'id' | 'position'> & {
    data: ContentNodeData,
    type: typeof CONTENT_NODE_TYPE,
}

export const ContentNodeHandles: Position[] = [Position.Left, Position.Right, Position.Top, Position.Bottom] as const

export const CONTENT_EDGE_TYPE = "CONTENT_EDGE" as const
export type ContentEdgeData = {
    content: string,
}
export type ContentEdge = Pick<Edge, 'id' | 'source' | 'target'> & {
    data: ContentEdgeData,
    type: typeof CONTENT_EDGE_TYPE,
    sourceHandle: string,
    targetHandle: string,
}

export const createEdgeId = (connection: Connection) => {
    return `vueflow__edge-${connection.source}${connection.sourceHandle ?? ''}-${connection.target}${connection.targetHandle ?? ''}`
}

export type MouseAction = "panDrag" | "selectionRect"

const initMindMap = () => {
    const defaultLayer: MindMapLayer = shallowReactive({
        id: MIND_MAP_ID,
        vueFlow: useVueFlow(MIND_MAP_ID),
        visible: true,
    })

    const global: MindMapGlobal = {
        zIndexIncrement: 0,
        layerIdIncrement: 0,
        nodeIdIncrement: 0,
        layers: shallowReactive<MindMapLayer[]>([
            defaultLayer
        ]),
        currentLayer: shallowRef<MindMapLayer>(
            defaultLayer
        ),
    }

    const layerId = computed(() => global.currentLayer.value.id)

    const isTouchDevice = ref('ontouchstart' in document.documentElement)
    const screenPosition = ref<XYPosition>({x: 0, y: 0})

    const {history, canUndo, canRedo} = useMindMapHistory(global)

    const getCurrentVueFlow = () => {
        return global.currentLayer.value.vueFlow
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

    const addLayer = async () => {
        const layerId = `layer-${global.layerIdIncrement++}`
        history.executeCommand("layer:add", layerId)
        await toggleLayer(layerId)
    }

    const removeLayer = (layerId: string) => {
        if (layerId === global.currentLayer.value.id) return
        if (global.layers.length === 1) return
        history.executeCommand("layer:remove", layerId)
    }

    const toggleLayer = async (layerId: string) => {
        const targetLayer = global.layers.find(layer => layer.id === layerId)
        if (targetLayer === undefined) throw new Error("layer is undefined")

        const currentViewport = toRaw(getCurrentVueFlow().viewport.value)
        cleanSelection()
        global.currentLayer.value = targetLayer
        await nextTick()
        await global.currentLayer.value.vueFlow.setViewport(currentViewport)
        setLayerConfigDefault()
    }

    const addNode = (position: XYPosition) => {
        return history.executeCommand("node:add", {
            layerId: layerId.value,
            node: {
                id: `node-${global.nodeIdIncrement++}`,
                position,
                type: CONTENT_NODE_TYPE,
                data: {
                    content: ""
                },
            }
        })
    }

    const checkConnectionExist = (connection: Connection): boolean => {
        const vueFlow = getCurrentVueFlow()
        return vueFlow.findEdge(createEdgeId(connection)) !== undefined ||
            vueFlow.findEdge(createEdgeId(reverseConnection(connection))) !== undefined
    }

    const addEdge = (connection: Connection) => {
        if (checkConnectionExist(connection)) return
        if (!checkFullConnection(connection)) return

        const id = createEdgeId(connection)

        history.executeCommand('edge:add', {
            layerId: layerId.value,
            edge: {
                ...connection,
                id,
                type: CONTENT_EDGE_TYPE,
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

    const importData = (data: MindMapImportData, leftTop: XYPosition = getCenterPosition()) => {
        const vueFlow = getCurrentVueFlow()

        blurActiveElement()
        const {newNodes, newEdges} = prepareImportIntoMindMap(vueFlow, data, leftTop)
        history.executeCommand("import", {layerId: layerId.value, nodes: newNodes, edges: newEdges})

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
        history.executeCommand('remove', {...data, layerId: layerId.value})
        focus()
        vueFlow.vueFlowRef.value?.addEventListener('blur', () => {
            focus()
        }, {once: true})
    }

    /**
     * 点击多选相关配置
     */
    const isMultiSelected = computed(() => {
        const vueFlow = getCurrentVueFlow()
        return vueFlow.getSelectedNodes.value.length + vueFlow.getSelectedEdges.value.length > 1
    })
    const canMultiSelect = computed(() => {
        const vueFlow = getCurrentVueFlow()
        return vueFlow.multiSelectionActive.value
    })
    const enableMultiSelect = () => {
        const vueFlow = getCurrentVueFlow()
        vueFlow.multiSelectionActive.value = true
    }
    const disableMultiSelect = () => {
        const vueFlow = getCurrentVueFlow()
        vueFlow.multiSelectionActive.value = false
    }
    const toggleMultiSelect = () => {
        if (canMultiSelect.value) {
            disableMultiSelect()
        } else {
            enableMultiSelect()
        }
    }

    /**
     * 框选相关配置
     */
    let selectionRectEnable: boolean = false
    let selectionRectMouseButton: number = 0

    const getByClientRect = (rect: {
        readonly x: number,
        readonly y: number,
        readonly width: number,
        readonly height: number
    }) => {
        const vueFlow = getCurrentVueFlow()

        const innerNodes: GraphNode[] = []
        const innerEdges: GraphEdge[] = []

        const leftTop = vueFlow.screenToFlowCoordinate({x: rect.x, y: rect.y})
        const rightBottom = vueFlow.screenToFlowCoordinate({x: rect.x + rect.width, y: rect.y + rect.height})

        for (const node of vueFlow.getNodes.value) {
            if (typeof node.width !== "number" || typeof node.height !== "number") continue

            const nodeLeft = node.position.x
            const nodeRight = node.position.x + node.width
            const nodeTop = node.position.y
            const nodeBottom = node.position.y + node.height

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

    const defaultMouseAction = ref<MouseAction>('panDrag')

    // 默认操作为拖拽
    const setDefaultPanDrag = () => {
        const vueFlow = getCurrentVueFlow()

        defaultMouseAction.value = 'panDrag'
        vueFlow.panOnDrag.value = isTouchDevice.value ? true : [0, 2]
        selectionRectMouseButton = 2
        selectionRectEnable = false
    }
    // 默认操作为框选，通过鼠标右键拖拽
    const setDefaultSelectionRect = () => {
        const vueFlow = getCurrentVueFlow()

        defaultMouseAction.value = 'selectionRect'
        vueFlow.panOnDrag.value = isTouchDevice.value ? false : [2]
        selectionRectMouseButton = 0
        selectionRectEnable = true
    }
    const toggleDefaultMouseAction = () => {
        if (defaultMouseAction.value === 'panDrag') {
            setDefaultSelectionRect()
        } else {
            setDefaultPanDrag()
        }
    }

    const canDrag = computed(() => {
        const vueFlow = getCurrentVueFlow()
        return vueFlow.nodesDraggable.value
    })
    const disableDrag = () => {
        const vueFlow = getCurrentVueFlow()
        vueFlow.nodesDraggable.value = false
    }
    const enableDrag = () => {
        const vueFlow = getCurrentVueFlow()
        vueFlow.nodesDraggable.value = true
    }

    const setLayerConfigDefault = () => {
        disableMultiSelect()
        setDefaultPanDrag()
        enableDrag()
    }
    setLayerConfigDefault()


    const initLayer = (layer: MindMapLayer) => {
        const {id, vueFlow} = layer
        const {
            vueFlowRef,
            onInit,

            screenToFlowCoordinate,

            onViewportChange,

            onNodeDragStart,
            onNodeDragStop,
            onConnect,
            onEdgeUpdateStart,
            onEdgeUpdate,

            getSelectedNodes,
            getSelectedEdges,
        } = vueFlow

        onViewportChange((viewport) => {
            for (const layer of global.layers) {
                if (layer.id !== id) {
                    layer.vueFlow.viewport.value = viewport
                }
            }
        })

        /**
         * 剪切板
         */
        useClipBoardWithKeyboard<MindMapImportData, MindMapExportData>(() => vueFlowRef.value, {
            exportData: (): MindMapExportData => {
                return exportMindMapSelection(vueFlow)
            },
            importData: (data: MindMapImportData) => {
                importData(data, screenToFlowCoordinate(screenPosition.value))
            },
            removeData: (data: MindMapExportData) => {
                remove({nodes: data.nodes?.map(it => it.id), edges: data.edges?.map(it => it.id)})
            },
            stringifyData: (data: MindMapExportData): string => {
                return jsonSortPropStringify(data)
            },
            validateInput: validateMindMapImportData
        })

        /**
         * 节点移动
         */
        const nodeMoveMap = new Map<string, XYPosition>

        onNodeDragStart(({nodes}) => {
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
                            history.executeCommand('node:move', {layerId: layerId.value, id: node.id, newPosition, oldPosition})
                        }
                    }
                }
            })
        })

        /**
         * 添加边
         */
        onConnect((connectData) => {
            addEdge(connectData)
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
                        history.executeCommand('edge:reconnect', {layerId: layerId.value, id: edge.id, newConnection: connection, oldConnection})
                    }
                }
            })
            vueFlowRef.value?.removeEventListener('selectstart', stopSelectStart)
        })

        /**
         * 初始化添加事件
         */
        onInit(() => {
            const el = vueFlowRef.value
            const viewportEl = vueFlowRef.value
            const paneEl = el?.querySelector('div.vue-flow__pane') as HTMLDivElement | null

            if (el === null || viewportEl === null || paneEl === null) {
                throw new Error("vueFlow Ref is undefined in onInit")
            }

            el.addEventListener('keydown', (e) => {
                // 按下 Delete 键删除选中的节点和边
                if (e.key === "Delete") {
                    if (getSelectedNodes.value.length === 0 && getSelectedEdges.value.length === 0) return

                    e.preventDefault()

                    remove({nodes: getSelectedNodes.value, edges: getSelectedEdges.value})
                }

                // 按下 Ctrl 键进入多选模式，直到松开 Ctrl 键
                else if (e.key === "Control") {
                    enableMultiSelect()
                    document.documentElement.addEventListener('keyup', (e) => {
                        if (e.key === "Control" || e.ctrlKey) {
                            disableMultiSelect()
                        }
                    }, {once: true})
                } else if (e.key === "Shift") {
                    if (judgeTargetIsInteraction(e)) return

                    toggleDefaultMouseAction()
                    document.documentElement.addEventListener('keyup', (e) => {
                        if (e.key === "Shift" || e.shiftKey) {
                            toggleDefaultMouseAction()
                        }
                    }, {once: true})
                } else if (e.ctrlKey) {
                    // 按下 Ctrl + z 键，进行历史记录的撤回重做
                    if ((e.key === "z" || e.key === "Z")) {
                        if (judgeTargetIsInteraction(e)) return

                        if (e.shiftKey) {
                            e.preventDefault()
                            history.redo()
                        } else {
                            e.preventDefault()
                            history.undo()
                        }
                    }

                    // 按下 Ctrl + a 键，全选
                    else if (e.key === "a" || e.key === "A") {
                        if (judgeTargetIsInteraction(e)) return

                        const isCurrentMultiSelect = isMultiSelected.value

                        e.preventDefault()
                        if (!isCurrentMultiSelect) enableMultiSelect()
                        vueFlow.addSelectedNodes(vueFlow.getNodes.value)
                        vueFlow.addSelectedEdges(vueFlow.getEdges.value)
                        if (!isCurrentMultiSelect) disableMultiSelect()
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
                paneEl.addEventListener('dblclick', (e) => {
                    if (e.target !== paneEl) return
                    addNode(screenToFlowCoordinate({x: e.clientX, y: e.clientY}))
                })

                let currentPanOnDrag = toRaw(vueFlow.panOnDrag.value)
                // 鼠标移入非交互元素时，允许拖拽，否则禁止画布拖拽
                paneEl.addEventListener('mouseover', (e) => {
                    if (judgeTargetIsInteraction(e)) {
                        currentPanOnDrag = toRaw(vueFlow.panOnDrag.value)
                        vueFlow.panOnDrag.value = false
                    } else {
                        vueFlow.panOnDrag.value = currentPanOnDrag
                    }
                })

                // 多选框
                paneEl.addEventListener('mousedown', (e) => {
                    if (e.target !== paneEl) return

                    // 如果开启了 selectionRectEnable，则将根据 selectionRectMouseButton 判断并进行拖曳创建选择框
                    if (selectionRectEnable) {
                        e.preventDefault()
                        vueFlow.multiSelectionActive.value = false

                        cleanSelection()

                        if (e.button === selectionRectMouseButton) {
                            vueFlow.userSelectionActive.value = true
                            vueFlow.multiSelectionActive.value = true

                            const start = {x: e.clientX, y: e.clientY}

                            const onMove = (e: MouseEvent) => {
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

                            const onMouseUp = () => {
                                vueFlow.userSelectionActive.value = false
                                vueFlow.userSelectionRect.value = null

                                document.documentElement.removeEventListener('mousemove', onMove)
                                document.documentElement.removeEventListener('mouseup', onMouseUp)

                                const newSelectedNodes = vueFlow.getSelectedNodes.value
                                const newSelectedEdges = vueFlow.getSelectedEdges.value
                                setTimeout(() => {
                                    cleanSelection()
                                    vueFlow.addSelectedNodes(newSelectedNodes)
                                    vueFlow.addSelectedEdges(newSelectedEdges)
                                    vueFlow.multiSelectionActive.value = false
                                })
                            }

                            document.documentElement.addEventListener('mousemove', onMove)
                            document.documentElement.addEventListener('mouseup', onMouseUp)
                        }
                    }
                })
            } else {
                // 设置屏幕位置
                paneEl.addEventListener('touchstart', (e) => {
                    screenPosition.value = {x: e.touches[0].clientX, y: e.touches[0].clientY}
                })
                paneEl.addEventListener('touchmove', (e) => {
                    screenPosition.value = {x: e.touches[0].clientX, y: e.touches[0].clientY}
                })

                // 双击添加节点
                let waitNextTouchEnd = false
                let waitTimeout: number | undefined
                paneEl.addEventListener('touchstart', (e) => {
                    if (e.target !== paneEl) return
                    if (waitNextTouchEnd) {
                        addNode(screenToFlowCoordinate({x: e.touches[0].clientX, y: e.touches[0].clientY}))
                        waitNextTouchEnd = false
                        clearTimeout(waitTimeout)
                        e.stopPropagation()
                    }
                })
                paneEl.addEventListener('touchend', (e) => {
                    if (e.target !== paneEl) return
                    if (!waitNextTouchEnd) {
                        waitNextTouchEnd = true
                        waitTimeout = setTimeout(() => {
                            waitNextTouchEnd = false
                        }, 150)
                    }
                })

                // 多选框
                paneEl.addEventListener('touchstart', (e) => {
                    if (e.target !== paneEl) return

                    // 如果开启了 selectionRect，则将根据 selectionRectMouseButton 判断并进行拖曳创建选择框
                    if (selectionRectEnable) {
                        e.preventDefault()
                        vueFlow.multiSelectionActive.value = false

                        cleanSelection()

                        vueFlow.userSelectionActive.value = true
                        vueFlow.multiSelectionActive.value = true

                        const start = {x: e.touches[0].clientX, y: e.touches[0].clientY}

                        const onMove = (e: TouchEvent) => {
                            e.preventDefault()
                            const current = {x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY}
                            let width = current.x - start.x
                            let height = current.y - start.y
                            const x = width > 0 ? start.x : current.x
                            const y = height > 0 ? start.y : current.y
                            width = width > 0 ? width : -width
                            height = height > 0 ? height : -height
                            vueFlow.userSelectionRect.value = {
                                width,
                                height,
                                x,
                                y,
                                startX: start.x,
                                startY: start.y,
                            }
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

                        const onTouchEnd = () => {
                            vueFlow.userSelectionActive.value = false
                            vueFlow.userSelectionRect.value = null

                            document.documentElement.removeEventListener('touchmove', onMove)
                            document.documentElement.removeEventListener('touchend', onTouchEnd)
                            document.documentElement.removeEventListener('touchcancel', onTouchEnd)

                            const newSelectedNodes = vueFlow.getSelectedNodes.value
                            const newSelectedEdges = vueFlow.getSelectedEdges.value
                            setTimeout(() => {
                                cleanSelection()
                                vueFlow.addSelectedNodes(newSelectedNodes)
                                vueFlow.addSelectedEdges(newSelectedEdges)
                                vueFlow.multiSelectionActive.value = false
                            })
                        }

                        document.documentElement.addEventListener('touchmove', onMove)
                        document.documentElement.addEventListener('touchend', onTouchEnd)
                        document.documentElement.addEventListener('touchcancel', onTouchEnd)
                    }
                })
            }
        })
    }

    return {
        layers: global.layers,
        currentLayer: global.currentLayer,
        initLayer,

        addLayer,
        removeLayer,
        toggleLayer,

        focus,

        isTouchDevice,

        canUndo: readonly(canUndo),
        canRedo: readonly(canRedo),
        undo: history.undo,
        redo: history.redo,

        findNode: (id: string) => {
            const vueFlow = getCurrentVueFlow()
            return vueFlow.findNode(id)
        },
        findEdge: (id: string) => {
            const vueFlow = getCurrentVueFlow()
            return vueFlow.findEdge(id)
        },
        addNode,
        addEdge,

        remove,

        fitView: () => {
            return getCurrentVueFlow().fitView()
        },

        isMultiSelected,
        canMultiSelect,
        disableMultiSelect,
        enableMultiSelect,
        toggleMultiSelect,

        defaultMouseAction: readonly(defaultMouseAction),
        toggleDefaultMouseAction,

        canDrag,
        disableDrag,
        enableDrag,

        selectNode: (id: string) => {
            const vueFlow = getCurrentVueFlow()
            const node = vueFlow.findNode(id)
            if (node !== undefined) {
                node.zIndex = global.zIndexIncrement++
                vueFlow.addSelectedNodes([node])
            }
        },
        updateNodeData: (id: string, data: ContentNodeData) => {
            history.executeCommand('node:data:change', {layerId: layerId.value, id, data})
        },
        selectEdge: (id: string) => {
            const vueFlow = getCurrentVueFlow()
            const edge = vueFlow.findEdge(id)
            if (edge !== undefined) {
                edge.zIndex = global.zIndexIncrement++
                vueFlow.addSelectedEdges([edge])
            }
        },
        updateEdgeData: (id: string, data: ContentEdgeData) => {
            history.executeCommand('edge:data:change', {layerId: layerId.value, id, data})
        },
    }
}

export type MindMapStore = ReturnType<typeof initMindMap>

let mindMap: MindMapStore | undefined = undefined

export const useMindMap = () => {
    if (mindMap === undefined) {
        mindMap = initMindMap()
    }
    return mindMap
}
