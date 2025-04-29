import {CommandDefinition, useCommandHistory} from "@/history/commandHistory.ts";
import {
    Connection,
    Edge,
    GraphEdge,
    GraphNode,
    Node,
    SelectionMode,
    useVueFlow,
    XYPosition,
} from "@vue-flow/core";
import {computed, readonly, ref, toRaw} from "vue";
import {checkElementParent, judgeTargetIsInteraction} from "@/mindMap/clickUtils.ts";
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
    "node:remove": CommandDefinition<string, { node: ContentNode, edges: ContentEdge[] }>,
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
    "edge:remove": CommandDefinition<string, ContentEdge>,
    "edge:reconnect": CommandDefinition<{
        id: string,
        oldConnection: Connection,
        newConnection: Connection,
    }, {
        id: string,
        oldConnection: Connection,
    }>;
    "edge:data:change": CommandDefinition<{ id: string, data: ContentEdgeData }>,
}

export type MouseAction = "panDrag" | "selectionRect"

const initMindMap = () => {
    const isTouchDevice = ref('ontouchstart' in document.documentElement);

    let nodeId = 0

    const vueFlow = useEdgeDrag(useVueFlow(MIND_MAP_ID))

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
    vueFlow.selectionMode.value = SelectionMode.Partial
    const defaultMouseAction = ref<MouseAction>('panDrag')

    // 默认操作为拖拽，按下 Shift 允许框选
    const setDefaultPanDrag = () => {
        defaultMouseAction.value = 'panDrag'
        vueFlow.selectionKeyCode.value = "Shift"
        vueFlow.panOnDrag.value = true
    }
    // 默认操作为框选，通过鼠标右键拖拽
    const setDefaultSelectionRect = () => {
        defaultMouseAction.value = 'selectionRect'
        vueFlow.selectionKeyCode.value = true
        vueFlow.panOnDrag.value = [2]
    }
    vueFlow.onPaneClick(() => {
        if (defaultMouseAction.value === 'selectionRect') {
            if (vueFlow.userSelectionRect.value !== null && vueFlow.userSelectionRect.value.width === 0 && vueFlow.userSelectionRect.value.height === 0) {
                vueFlow.selectionKeyCode.value = false
            } else {
                vueFlow.selectionKeyCode.value = true
            }
            vueFlow.panOnDrag.value = [2]
        }
    })
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

    history.registerCommand("node:remove", {
        applyAction: (nodeId) => {
            const node = findNode(nodeId)
            if (node === undefined) {
                throw new Error("node is undefined")
            }
            const connectedEdges = vueFlow.getConnectedEdges(nodeId)
            vueFlow.removeSelectedEdges(connectedEdges)
            vueFlow.removeEdges(connectedEdges)

            vueFlow.removeSelectedNodes([node])
            vueFlow.removeNodes(nodeId)
            return {node: node as ContentNode, edges: connectedEdges as ContentEdge[]}
        },
        revertAction: ({node, edges}) => {
            addNodes(node)
            addEdges(edges)
            return node.id
        },
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

    history.registerCommand("edge:remove", {
        applyAction: (edgeId) => {
            const edge = findEdge(edgeId)
            if (edge === undefined) {
                throw new Error("edge is undefined")
            }
            vueFlow.removeSelectedEdges([edge])
            vueFlow.removeEdges(edgeId)
            return edge as ContentEdge
        },
        revertAction: (edge) => {
            addEdges(edge)
            return edge.id
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
            data: {
                content: ""
            },
        })
    }

    const remove = (nodes: GraphNode[], edges: GraphEdge[]) => {
        history.executeBatch(Symbol("remove"), () => {
            nodes.forEach((node) => {
                if (node && findNode(node.id)) {
                    history.executeCommand('node:remove', node.id)
                }
            })
            edges.forEach((edge) => {
                if (edge && findEdge(edge.id)) {
                    history.executeCommand('edge:remove', edge.id)
                }
            })
        })
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

        const blurActiveElement = () => {
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur()
            }
        }

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.target === el || e.target instanceof Element && checkElementParent(e.target, el) && !judgeTargetIsInteraction(e)) {
                if (e.ctrlKey) {
                    if ((e.key === "z" || e.key === "Z")) {
                        if (e.shiftKey) {
                            blurActiveElement()
                            el.focus()
                            e.preventDefault()
                            history.redo()
                        } else {
                            blurActiveElement()
                            el.focus()
                            e.preventDefault()
                            history.undo()
                        }
                    } else if (e.key === "a" || e.key === "A") {
                        e.preventDefault()
                        enableMultiSelect()
                        vueFlow.addSelectedNodes(vueFlow.getNodes.value)
                        vueFlow.addSelectedEdges(vueFlow.getEdges.value)
                        disableMultiSelect()
                    }
                }
            }
        })

        el.addEventListener('keydown', (e) => {
            if (e.key === "Delete") {
                if (getSelectedNodes.value.length === 0 && getSelectedEdges.value.length === 0) return

                e.preventDefault()
                el.focus()

                history.executeBatch(Symbol("delete"), () => {
                    remove(getSelectedNodes.value, getSelectedEdges.value)
                })
            }

            else if (e.key === "Control") {
                enableMultiSelect()
                document.documentElement.addEventListener('keyup', (e) => {
                    if (e.key === "Control" || e.ctrlKey) {
                        disableMultiSelect()
                    }
                }, {once: true})
            }
        })

        if (!isTouchDevice.value) {
            paneEl.addEventListener('dblclick', (e) => {
                if (e.target !== paneEl) return
                addNode(clientToViewport({x: e.clientX, y: e.clientY}))
            })

            paneEl.addEventListener('mouseover', (e) => {
                if (judgeTargetIsInteraction(e)) {
                    if (vueFlow.panOnDrag.value) {
                        vueFlow.panOnDrag.value = false
                    }
                } else {
                    if (!vueFlow.panOnDrag.value) {
                        vueFlow.panOnDrag.value = true
                    }
                }
            })
        } else {
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
        isTouchDevice,

        canUndo: readonly(canUndo),
        canRedo: readonly(canRedo),
        undo: history.undo,
        redo: history.redo,

        addNode,
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
                node.zIndex = zIndex ++
                vueFlow.addSelectedNodes([node])
            }
        },
        updateNodeData: (id: string, data: ContentNodeData) => {
            history.executeCommand('node:data:change', {id, data})
        },
        selectEdge: (id: string) => {
            const edge = findEdge(id)
            if (edge !== undefined) {
                edge.zIndex = zIndex ++
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
