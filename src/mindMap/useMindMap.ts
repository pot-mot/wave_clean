import {CommandDefinition, useCommandHistory} from "@/history/commandHistory.ts";
import {Connection, Edge, GraphEdge, GraphNode, Node, useVueFlow, XYPosition,} from "@vue-flow/core";
import {computed, readonly, ref, toRaw} from "vue";
import {blurActiveElement, judgeTargetIsInteraction} from "@/mindMap/clickUtils.ts";
import {useEdgeDrag} from "@/mindMap/useEdgeDrag.ts";
import {jsonSortPropStringify} from "@/json/jsonStringify.ts";

export const MIND_MAP_ID = "mind_map" as const

const CONTENT_NODE_TYPE = "CONTENT_NODE" as const
export type ContentNodeData = {
    content: string,
}
export type ContentNode = Node & {
    data: ContentNodeData,
    type: typeof CONTENT_NODE_TYPE,
}

const CONTENT_EDGE_TYPE = "CONTENT_EDGE" as const
export type ContentEdgeData = {
    content: string,
}
export type ContentEdge = Edge & {
    data: ContentEdgeData,
    type: typeof CONTENT_EDGE_TYPE,
}

type MindMapHistoryCommands = {
    "node:add": CommandDefinition<ContentNode, string>,
    "node:move": CommandDefinition<{
        id: string,
        newPosition: XYPosition,
        oldPosition: XYPosition,
    }, {
        id: string,
        oldPosition: XYPosition,
    }>,
    "node:data:change": CommandDefinition<{ id: string, data: ContentNodeData }>,

    "edge:add": CommandDefinition<ContentEdge, string>,
    "edge:reconnect": CommandDefinition<{
        id: string,
        oldConnection: Connection,
        newConnection: Connection,
    }, {
        id: string,
        oldConnection: Connection,
    }>;
    "edge:data:change": CommandDefinition<{ id: string, data: ContentEdgeData }>,

    "remove": CommandDefinition<{
        nodes?: (GraphNode | string)[],
        edges?: (GraphEdge | string)[]
    }, {
        nodes: GraphNode[],
        edges: GraphEdge[]
    }>,
}

export type MouseAction = "panDrag" | "selectionRect"

const initMindMap = () => {
    const isTouchDevice = ref('ontouchstart' in document.documentElement);

    let nodeId = 0

    const vueFlow = useEdgeDrag(useVueFlow(MIND_MAP_ID))
    const focus = () => {
        vueFlow.vueFlowRef.value?.focus()
    }

    let zIndex = 0

    /**
     * 点击多选相关配置
     */
    vueFlow.multiSelectionKeyCode.value = null
    vueFlow.connectOnClick.value = false
    vueFlow.selectNodesOnDrag.value = false

    const isMultiSelected = computed(() => {
        return vueFlow.getSelectedNodes.value.length + vueFlow.getSelectedEdges.value.length > 1
    })
    const canMultiSelect = computed(() => {
        return vueFlow.multiSelectionActive.value
    })
    const enableMultiSelect = () => {
        vueFlow.multiSelectionActive.value = true
    }
    const disableMultiSelect = () => {
        vueFlow.multiSelectionActive.value = false
    }
    const toggleMultiSelect = () => {
        if (canMultiSelect.value) {
            disableMultiSelect()
        } else {
            enableMultiSelect()
        }
    }
    disableMultiSelect()


    /**
     * 框选相关配置
     */
    vueFlow.selectionKeyCode.value = false

    const selectionRect = ref(false)
    const selectionRectMouseButton = ref<number>(0)

    const defaultMouseAction = ref<MouseAction>('panDrag')

    // 默认操作为拖拽
    const setDefaultPanDrag = () => {
        defaultMouseAction.value = 'panDrag'
        vueFlow.panOnDrag.value = [0, 2]
        selectionRectMouseButton.value = 2
        selectionRect.value = false
    }
    // 默认操作为框选，通过鼠标右键拖拽
    const setDefaultSelectionRect = () => {
        defaultMouseAction.value = 'selectionRect'
        vueFlow.panOnDrag.value = [2]
        selectionRectMouseButton.value = 0
        selectionRect.value = true
    }
    const toggleDefaultMouseAction = () => {
        if (defaultMouseAction.value === 'panDrag') {
            setDefaultSelectionRect()
        } else {
            setDefaultPanDrag()
        }
    }
    setDefaultPanDrag()

    const canDrag = computed(() => {
        return vueFlow.nodesDraggable.value
    })
    const disableDrag = () => {
        vueFlow.nodesDraggable.value = false
    }
    const enableDrag = () => {
        vueFlow.nodesDraggable.value = true
    }
    enableDrag()

    const {
        vueFlowRef,
        onInit,

        getViewport,
        addNodes,
        updateNode,
        updateNodeData,
        addEdges,
        updateEdgeData,
        findNode,
        findEdge,
        onNodeDragStart,
        onNodeDragStop,
        onConnect,
        onEdgeDragStart,
        onEdgeDragStop,

        getSelectedNodes,
        getSelectedEdges,
    } = vueFlow

    const clientToViewport = (point: XYPosition): XYPosition => {
        const canvasRect = vueFlowRef.value!.getBoundingClientRect()

        const viewport = getViewport()

        const localX = point.x - canvasRect.left
        const localY = point.y - canvasRect.top

        return {x: (localX - viewport.x) / viewport.zoom, y: (localY - viewport.y) / viewport.zoom}
    }

    const history = useCommandHistory<MindMapHistoryCommands>()

    const canUndo = ref(false)
    const canRedo = ref(false)
    history.eventBus.on("change", () => {
        canUndo.value = history.canUndo()
        canRedo.value = history.canRedo()
    })

    history.registerCommand("node:add", {
        applyAction: (node) => {
            addNodes(node)
            return node.id
        },
        revertAction: (nodeId) => {
            const node = findNode(nodeId)
            if (node !== undefined) {
                vueFlow.removeSelectedNodes([node])
                vueFlow.removeNodes(nodeId)
                return node as ContentNode
            }
        }
    })

    history.registerCommand("node:move", {
        applyAction: ({id, newPosition, oldPosition}) => {
            updateNode(id, {
                position: newPosition
            })
            return {
                id,
                oldPosition
            }
        },
        revertAction: ({id, oldPosition}) => {
            updateNode(id, {
                position: oldPosition
            })
        }
    })


    history.registerCommand("node:data:change", {
        applyAction: ({id, data}) => {
            const node = findNode(id) as ContentNode | undefined
            if (node === undefined) throw new Error("node is undefined")

            const previousData = toRaw(node.data)
            updateNodeData(id, data, {replace: true})
            return {id, data: previousData}
        },
        revertAction: ({id, data}) => {
            const node = findNode(id) as ContentNode | undefined
            if (node === undefined) throw new Error("node is undefined")

            const currentData = toRaw(node.data)
            updateNodeData(id, data, {replace: true})
            return {id, data: currentData}
        }
    })

    history.registerCommand("edge:add", {
        applyAction: (edge) => {
            addEdges(edge)
            return edge.id
        },
        revertAction: (edgeId) => {
            const edge = findEdge(edgeId)
            if (edge !== undefined) {
                vueFlow.removeSelectedEdges([edge])
                vueFlow.removeEdges(edgeId)
                return edge as ContentEdge
            }
        }
    })

    history.registerCommand("edge:reconnect", {
        applyAction: ({id, oldConnection, newConnection}) => {
            const edge = findEdge(id)
            if (edge === undefined) {
                throw new Error("edge is undefined")
            }
            vueFlow.updateEdge(edge, {...newConnection})
            return {id, oldConnection}
        },
        revertAction: ({id, oldConnection}) => {
            const edge = findEdge(id)
            if (edge === undefined) {
                throw new Error("edge is undefined")
            }
            vueFlow.updateEdge(edge, {...oldConnection})
        }
    })

    history.registerCommand("edge:data:change", {
        applyAction: ({id, data}) => {
            const edge = findEdge(id) as ContentEdge | undefined
            if (edge === undefined) throw new Error("edge is undefined")

            const previousData = toRaw(edge.data)
            updateEdgeData(id, data, {replace: true})
            return {id, data: previousData}
        },
        revertAction: ({id, data}) => {
            const edge = findEdge(id) as ContentEdge | undefined
            if (edge === undefined) throw new Error("edge is undefined")

            const currentData = toRaw(edge.data)
            updateEdgeData(id, data, {replace: true})
            return {id, data: currentData}
        }
    })

    const addNode = (position: XYPosition) => {
        return history.executeCommand("node:add", {
            id: `node-${nodeId++}`,
            position,
            type: CONTENT_NODE_TYPE,
            zIndex: zIndex++,
            data: {
                content: ""
            },
        })
    }

    const addEdge = (connectData: Connection) => {
        const id = `vueflow__edge-${connectData.source}${connectData.sourceHandle ?? ''}-${connectData.target}${connectData.targetHandle ?? ''}`
        if (findEdge(id)) return

        history.executeCommand('edge:add', {
            ...connectData,
            id,
            type: CONTENT_EDGE_TYPE,
            zIndex: zIndex++,
            data: {
                content: ""
            },
        })
    }

    history.registerCommand("remove", {
        applyAction: (data) => {
            const removedNodes: GraphNode[] = []
            const removedEdges: GraphEdge[] = []

            data?.edges?.forEach((edge) => {
                const edgeId = typeof edge === "string" ? edge : edge.id
                const foundEdge = findEdge(edgeId)
                if (foundEdge) {
                    removedEdges.push(foundEdge)
                }
            })
            data?.nodes?.forEach((node) => {
                const nodeId = typeof node === "string" ? node : node.id
                const foundNode = findNode(nodeId)
                if (foundNode) {
                    removedNodes.push(foundNode)
                }
            })
            removedEdges.push(...vueFlow.getConnectedEdges(removedNodes))
            vueFlow.removeSelectedEdges(removedEdges)
            vueFlow.removeSelectedNodes(removedNodes)
            vueFlow.removeEdges(removedEdges)
            vueFlow.removeNodes(removedNodes)

            return {
                nodes: removedNodes,
                edges: removedEdges
            }
        },
        revertAction: (data) => {
            const {nodes, edges} = data
            addNodes(nodes)
            addEdges(edges)
            return {nodes, edges}
        },
    })

    const remove = (data: { nodes?: (GraphNode | string)[], edges?: (GraphEdge | string)[] }) => {
        blurActiveElement()
        history.executeCommand('remove', data)
        focus()
        vueFlow.vueFlowRef.value?.addEventListener('blur', () => {
            focus()
        }, {once: true})
    }

    onConnect((connectData) => {
        addEdge(connectData)
    })

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
                    history.executeCommand('node:move', {id: node.id, newPosition: node.position, oldPosition})
                }
            }
        })
    })


    const edgeReconnectMap = new Map<string, Connection>

    onEdgeDragStart(({edges}) => {
        for (const edge of edges) {
            const connection: Connection = {
                source: edge.source,
                sourceHandle: edge.sourceHandle,
                target: edge.target,
                targetHandle: edge.targetHandle,
            }
            edgeReconnectMap.set(edge.id, connection)
        }
    })

    onEdgeDragStop(({edges}) => {
        history.executeBatch(Symbol("edge:reconnect"), () => {
            for (const edge of edges) {
                const oldConnection = edgeReconnectMap.get(edge.id)
                edgeReconnectMap.delete(edge.id)
                if (oldConnection !== undefined) {
                    const newConnection = {
                        source: edge.source,
                        sourceHandle: edge.sourceHandle,
                        target: edge.target,
                        targetHandle: edge.targetHandle,
                    }
                    if (jsonSortPropStringify(oldConnection) != jsonSortPropStringify(newConnection)) {
                        history.executeCommand('edge:reconnect', {id: edge.id, newConnection, oldConnection})
                    }
                }
            }
        })
    })


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
            // 双击添加节点
            paneEl.addEventListener('dblclick', (e) => {
                if (e.target !== paneEl) return
                addNode(clientToViewport({x: e.clientX, y: e.clientY}))
            })

            let currentPanOnDrag = vueFlow.panOnDrag.value
            // 鼠标移入非交互元素时，允许拖拽，否则禁止画布拖拽
            paneEl.addEventListener('mouseover', (e) => {
                if (judgeTargetIsInteraction(e)) {
                    currentPanOnDrag = vueFlow.panOnDrag.value
                    vueFlow.panOnDrag.value = false
                } else {
                    vueFlow.panOnDrag.value = currentPanOnDrag
                }
            })

            // 多选框
            paneEl.addEventListener('mousedown', (e) => {
                if (e.target !== paneEl) return

                // 如果开启了 selectionRect，则将根据 selectionRectMouseButton 判断并进行拖曳创建选择框
                if (selectionRect.value) {
                    vueFlow.multiSelectionActive.value = false

                    vueFlow.removeSelectedNodes(vueFlow.getSelectedNodes.value)
                    vueFlow.removeSelectedEdges(vueFlow.getSelectedEdges.value)

                    if (e.button === selectionRectMouseButton.value) {
                        vueFlow.userSelectionActive.value = true
                        vueFlow.multiSelectionActive.value = true

                        const start = {x: e.clientX, y: e.clientY}
                        vueFlow.userSelectionRect.value = {
                            width: 0,
                            height: 0,
                            x: start.x,
                            y: start.y,
                            startX: start.x,
                            startY: start.y,
                        }

                        const onMove = (e: MouseEvent) => {
                            const current = {x: e.clientX, y: e.clientY}
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
                            const newSelectedNodes: GraphNode[] = []

                            const leftTop = clientToViewport({x, y})
                            const rightBottom = clientToViewport({x: x + width, y: y + height})

                            for (const node of vueFlow.getNodes.value) {
                                if (typeof node.width !== "number" || typeof node.height !== "number") return

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
                                    newSelectedNodes.push(node);
                                }
                            }

                            vueFlow.removeSelectedNodes(vueFlow.getSelectedNodes.value)
                            vueFlow.addSelectedNodes(newSelectedNodes)
                        }

                        const onMouseUp = () => {
                            vueFlow.userSelectionActive.value = false
                            vueFlow.userSelectionRect.value = null

                            document.documentElement.removeEventListener('mousemove', onMove)
                            document.documentElement.removeEventListener('mouseup', onMouseUp)

                            const newSelectedNodes = vueFlow.getSelectedNodes.value
                            setTimeout(() => {
                                vueFlow.addSelectedNodes(newSelectedNodes)
                                vueFlow.multiSelectionActive.value = false
                            })
                        }

                        document.documentElement.addEventListener('mousemove', onMove)
                        document.documentElement.addEventListener('mouseup', onMouseUp)
                    }
                }
            })
        } else {
            // 双击添加节点
            let waitNextTouchEnd = false
            let waitTimeout: number | undefined
            paneEl.addEventListener('touchstart', (e) => {
                if (e.target !== paneEl) return
                if (waitNextTouchEnd) {
                    addNode(clientToViewport({x: e.touches[0].clientX, y: e.touches[0].clientY}))
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
        }
    })

    return {
        focus,

        isTouchDevice,

        canUndo: readonly(canUndo),
        canRedo: readonly(canRedo),
        undo: history.undo,
        redo: history.redo,

        findNode,
        addNode,
        findEdge,
        addEdge,
        remove,

        fitView: vueFlow.fitView,

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
            const node = findNode(id)
            if (node !== undefined) {
                node.zIndex = zIndex++
                vueFlow.addSelectedNodes([node])
            }
        },
        updateNodeData: (id: string, data: ContentNodeData) => {
            history.executeCommand('node:data:change', {id, data})
        },
        selectEdge: (id: string) => {
            const edge = findEdge(id)
            if (edge !== undefined) {
                edge.zIndex = zIndex++
                vueFlow.addSelectedEdges([edge])
            }
        },
        updateEdgeData: (id: string, data: ContentEdgeData) => {
            history.executeCommand('edge:data:change', {id, data})
        },
    }
}

let mindMap: ReturnType<typeof initMindMap> | undefined = undefined

export const useMindMap = () => {
    if (mindMap === undefined) {
        mindMap = initMindMap()
    }
    return mindMap
}
