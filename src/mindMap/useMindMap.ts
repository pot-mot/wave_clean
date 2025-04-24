import {CommandDefinition, useCommandHistory} from "@/history/commandHistory.ts";
import {Edge, Node, useVueFlow, XYPosition} from "@vue-flow/core";
import {toRaw} from "vue";

export const MIND_MAP_ID = "mind_map" as const

const CONTENT_NODE_TYPE = "CONTENT_NODE" as const
export type ContentNodeData = {
    content: string,
}
export type ContentNode = Node & {
    data: ContentNodeData,
    type: typeof CONTENT_NODE_TYPE
}

const CONTENT_EDGE_TYPE = "CONTENT_EDGE" as const
export type ContentEdgeData = {
    content: string,
}
export type ContentEdge = Edge & {
    data: ContentEdgeData,
    type: typeof CONTENT_EDGE_TYPE
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
    "edge:data:change": CommandDefinition<{ id: string, data: ContentEdgeData }>,
}

const initMindMap = () => {
    let nodeId = 0

    const {
        vueFlowRef,
        onInit,

        getViewport,

        addNodes,
        removeNodes,
        updateNode,
        updateNodeData,
        addEdges,
        removeEdges,
        updateEdgeData,
        findNode,
        findEdge,
        onNodeDragStart,
        onNodeDragStop,
        onConnect,

        zoomOnDoubleClick,
    } = useVueFlow(MIND_MAP_ID)
    zoomOnDoubleClick.value = false

    const clientToViewport = (point: XYPosition): XYPosition => {
        const canvasRect = vueFlowRef.value!.getBoundingClientRect()

        const viewport = getViewport()

        const localX = point.x - canvasRect.left
        const localY = point.y - canvasRect.top

        return { x:  (localX - viewport.x) / viewport.zoom, y: (localY - viewport.y) / viewport.zoom }
    }

    const history = useCommandHistory<MindMapHistoryCommands>()

    history.registerCommand("node:add", {
        applyAction: (node) => {
            addNodes(node)
            return node.id
        },
        revertAction: (nodeId) => {
            const node = findNode(nodeId) as ContentNode | undefined
            if (node !== undefined) {
                removeNodes(nodeId)
                return node
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
            updateNodeData(id, data)
            return {id, data: previousData}
        },
        revertAction: ({id, data}) => {
            const node = findNode(id) as ContentNode | undefined
            if (node === undefined) throw new Error("node is undefined")

            const currentData = toRaw(node.data)
            updateNodeData(id, data)
            return {id, data: currentData}
        }
    })

    history.registerCommand("edge:add", {
        applyAction: (edge) => {
            addEdges(edge)
            return edge.id
        },
        revertAction: (edgeId) => {
            const edge = findEdge(edgeId) as ContentEdge | undefined
            if (edge !== undefined) {
                removeEdges(edgeId)
                return edge
            }
        }
    })

    history.registerCommand("edge:data:change", {
        applyAction: ({id, data}) => {
            const edge = findEdge(id) as ContentEdge | undefined
            if (edge === undefined) throw new Error("edge is undefined")

            const previousData = toRaw(edge.data)
            updateEdgeData(id, data)
            return {id, data: previousData}
        },
        revertAction: ({id, data}) => {
            const edge = findEdge(id) as ContentEdge | undefined
            if (edge === undefined) throw new Error("edge is undefined")

            const currentData = toRaw(edge.data)
            updateEdgeData(id, data)
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
            }
        })
    }

    onConnect((connectData) => {
        history.executeCommand('edge:add', {
            ...connectData,
            id: `edge-${connectData.source}-${connectData.sourceHandle}-${connectData.target}-${connectData.sourceHandle}`,
            type: CONTENT_EDGE_TYPE,
            data: {
                content: ""
            },
        })
    })

    const nodeMoveMap = new Map<string, XYPosition>

    onNodeDragStart(({nodes}) => {
        for (const node of nodes) {
            nodeMoveMap.set(node.id, node.position)
        }
    })

    onNodeDragStop(({nodes}) => {
        for (const node of nodes) {
            const oldPosition = nodeMoveMap.get(node.id)
            if (oldPosition !== undefined) {
                history.executeCommand('node:move', {id: node.id, newPosition: node.position, oldPosition})
            }
        }
    })

    onInit(() => {
        const el = vueFlowRef.value
        if (el === null) {
            throw new Error("vueFlowRef is undefined in onInit")
        }

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            console.log(e.target)

            if (e.target === el) {
                if (e.ctrlKey) {
                    if ((e.key === "z" || e.key === "Z")) {
                        if (e.shiftKey) {
                            e.preventDefault()
                            history.redo()
                        } else {
                            e.preventDefault()
                            el.focus()
                            history.undo()
                        }
                    }
                }
            }
        })

        el.addEventListener('dblclick', (e) => {
            if (!(e.target instanceof HTMLElement)) return
            if (!e.target.classList.contains('vue-flow__pane')) return

            const nodeId = addNode(clientToViewport({x: e.clientX, y: e.clientY}))
            const node = findNode(nodeId) as ContentNode | undefined
            if (node === undefined) {
                throw new Error("new node not find")
            }
        })
    })

    return {
        updateNodeData: (id: string, data: ContentNodeData) => {
            history.executeCommand('node:data:change', {id, data})
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
