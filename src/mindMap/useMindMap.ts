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

const initMindMap = () => {
    const isTouchDevice = ref('ontouchstart' in document.documentElement);

    let nodeId = 0

    const vueFlow = useEdgeDrag(useVueFlow(MIND_MAP_ID))

    vueFlow.zoomOnDoubleClick.value = false
    vueFlow.zoomOnPinch.value = false
    vueFlow.selectionMode.value = SelectionMode.Partial
    vueFlow.multiSelectionKeyCode.value = null
    vueFlow.connectOnClick.value = false
    vueFlow.selectNodesOnDrag.value = false

    const isMultiSelected = computed(() => {
        return vueFlow.getSelectedNodes.value.length > 0 && vueFlow.getSelectedEdges.value.length > 0
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
    disableMultiSelect()

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
                history.executeCommand('node:remove', node.id)
            })
            edges.forEach((edge) => {
                history.executeCommand('edge:remove', edge.id)
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
                    history.executeCommand('edge:reconnect', {id: edge.id, newConnection, oldConnection})
                }
            }
        })
    })


    onInit(() => {
        const el = vueFlowRef.value
        if (el === null) {
            throw new Error("vueFlowRef is undefined in onInit")
        }

        const checkTargetIsPane = (e: Event) => {
            if (!(e.target instanceof HTMLElement)) return false
            if (!e.target.classList.contains('vue-flow__pane')) return false
            if (checkElementParent(e.target, el))
                return true
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
                if (judgeTargetIsInteraction(e)) return

                if (getSelectedNodes.value.length === 0 && getSelectedEdges.value.length === 0) return

                e.preventDefault()
                el.focus()

                history.executeBatch(Symbol("delete"), () => {
                    remove(getSelectedNodes.value, getSelectedEdges.value)
                })
            }

            if (e.key === "Control") {
                enableMultiSelect()
                document.documentElement.addEventListener('keyup', (e) => {
                    if (e.key === "Control") {
                        disableMultiSelect()
                    }
                }, {once: true})
            }
        })

        el.addEventListener('dblclick', (e) => {
            if (!checkTargetIsPane(e)) return
            addNode(clientToViewport({x: e.clientX, y: e.clientY}))
        })
        el.addEventListener('touchend', () => {
            const createOnNextTouchEnd = (e: TouchEvent) => {
                if (!checkTargetIsPane(e)) return
                if (e.touches.length === 1) {
                    addNode(clientToViewport({x: e.touches[0].clientX, y: e.touches[0].clientY}))
                }
            }
            el.addEventListener('touchend', createOnNextTouchEnd, {once: true})
            setTimeout(() => {
                el.removeEventListener('touchend', createOnNextTouchEnd)
            }, 100)
        })

        el.addEventListener('mouseover', (e) => {
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

        canDrag,
        disableDrag,
        enableDrag,

        selectNode: (id: string) => {
            const node = findNode(id)
            if (node !== undefined) {
                vueFlow.addSelectedNodes([node])
            }
        },
        updateNodeData: (id: string, data: ContentNodeData) => {
            history.executeCommand('node:data:change', {id, data})
        },
        selectEdge: (id: string) => {
            const edge = findEdge(id)
            if (edge !== undefined) {
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
