import {type CommandDefinition, useCommandHistory} from "@/history/commandHistory.ts";
import {type GraphEdge, type GraphNode, useVueFlow, type VueFlowStore, type XYPosition} from "@vue-flow/core";
import {type FullConnection} from "@/mindMap/edge/connection.ts";
import {
    createEdgeId,
    createVueFlowId,
    type MindMapGlobal
} from "@/mindMap/useMindMap.ts";
import {ref, shallowReactive} from "vue";
import {exportMindMapData, type MindMapExportData} from "@/mindMap/export/export.ts";
import {prepareImportIntoMindMap} from "@/mindMap/import/import.ts";
import {getRaw} from "@/utils/json/getRaw.ts";
import {getKeys} from "@/utils/type/typeGuard.ts";
import {type MindMapLayer, type MindMapLayerDiffData, type RawMindMapLayer} from "@/mindMap/layer/MindMapLayer.ts";
import {type ContentNode, type ContentNodeData, validateContentNode} from "@/mindMap/node/ContentNode.ts";
import {type ContentEdge, type ContentEdgeData, validateContentEdge} from "@/mindMap/edge/ContentEdge.ts";

export type MindMapHistoryCommands = {
    "layer:add": CommandDefinition<
        MindMapLayer,
        string
    >,
    "layer:remove": CommandDefinition<
        string,
        Omit<RawMindMapLayer, "vueFlow"> & { data: MindMapExportData, index: number }
    >,
    "layer:visible:change": CommandDefinition<{
        layerId: string,
        visible: boolean
    }>,
    "layer:lock:change": CommandDefinition<{
        layerId: string,
        lock: boolean,
    }>,
    "layer:data:change": CommandDefinition<{
        layerId: string,
        newData: Partial<MindMapLayerDiffData>,
    }, {
        layerId: string,
        oldData: Partial<MindMapLayerDiffData>,
    }>,
    "layer:toggle": CommandDefinition<string>,
    "layer:dragged": CommandDefinition<{
        oldIndex: number,
        newIndex: number,
    }>,
    "layer:swapped": CommandDefinition<{
        oldIndex: number,
        newIndex: number,
    }>,

    "node:add": CommandDefinition<{
        layerId: string,
        node: ContentNode,
    }, {
        layerId: string,
        nodeId: string,
    }>,
    "node:move": CommandDefinition<{
        layerId: string,
        id: string,
        newPosition: XYPosition,
        oldPosition: XYPosition,
    }, {
        layerId: string,
        id: string,
        oldPosition: XYPosition,
    }>,
    "node:data:change": CommandDefinition<{
        layerId: string,
        id: string,
        data: Partial<ContentNodeData>,
    }>,
    "node:resize": CommandDefinition<{
        layerId: string,
        id: string,
        newSize: { width: number, height: number },
        oldSize: { width: number, height: number },
        newPosition: XYPosition,
        oldPosition: XYPosition,
    }>,

    "edge:add": CommandDefinition<{
        layerId: string,
        edge: ContentEdge,
    }, {
        layerId: string,
        edgeId: string,
    }>,
    "edge:reconnect": CommandDefinition<{
        layerId: string,
        id: string,
        oldConnection: FullConnection,
        newConnection: FullConnection,
    }, {
        layerId: string,
        id: string,
        oldConnection: FullConnection,
    }>;
    "edge:data:change": CommandDefinition<{
        layerId: string,
        id: string,
        data: Partial<ContentEdgeData>
    }>,

    "import": CommandDefinition<{
        layerId: string,
        nodes: ContentNode[],
        edges: ContentEdge[]
    }, {
        layerId: string,
        nodeIds: string[],
        edgeIds: string[]
    }>,
    "remove": CommandDefinition<{
        layerId: string,
        nodes?: (GraphNode | string)[],
        edges?: (GraphEdge | string)[]
    }, {
        layerId: string,
        nodes: GraphNode[],
        edges: GraphEdge[]
    }>,
}

export const useMindMapHistory = (global: MindMapGlobal) => {
    const getLayer = (layerId: string): MindMapLayer => {
        const layer = global.layers.find(layer => layer.id === layerId)
        if (layer === undefined) throw new Error(`layer [${layerId}] is undefined`)
        return layer
    }

    const getLayerIndex = (layerId: string): number => {
        const layerIndex = global.layers.findIndex(layer => layer.id === layerId)
        if (layerIndex === -1) throw new Error(`layer [${layerId}] is undefined`)
        return layerIndex
    }

    const getVueFlow = (layerId: string): VueFlowStore => {
        return getLayer(layerId).vueFlow
    }

    const history = useCommandHistory<MindMapHistoryCommands>()

    const canUndo = ref(history.canUndo())
    const canRedo = ref(history.canRedo())
    history.eventBus.on("clean", () => {
        canUndo.value = history.canUndo()
        canRedo.value = history.canRedo()
    })
    history.eventBus.on("change", () => {
        canUndo.value = history.canUndo()
        canRedo.value = history.canRedo()
    })
    history.eventBus.on("batchStop", () => {
        canUndo.value = history.canUndo()
        canRedo.value = history.canRedo()
    })

    history.registerCommand("layer:add", {
        applyAction: (layer) => {
            const currentLayerIndex = getLayerIndex(global.currentLayer.value.id)
            global.layers.splice(currentLayerIndex + 1, 0, layer)
            return layer.id
        },
        revertAction: (layerId) => {
            const layerIndex = getLayerIndex(layerId)
            const layer = global.layers.splice(layerIndex, 1)[0]
            const data = exportMindMapData(layer.vueFlow)
            layer.vueFlow.$destroy()

            const vueFlow = useVueFlow(createVueFlowId())
            const {newNodes, newEdges} = prepareImportIntoMindMap(vueFlow, data)
            vueFlow.addNodes(newNodes)
            vueFlow.addEdges(newEdges)

            return shallowReactive({
                ...layer,
                vueFlow,
            })
        }
    })

    history.registerCommand("layer:remove", {
        applyAction: (layerId) => {
            const index = getLayerIndex(layerId)
            const {vueFlow, ...layerPart} = global.layers.splice(index, 1)[0]
            const data = exportMindMapData(vueFlow)
            vueFlow.$destroy()
            return {...layerPart, data, index}
        },
        revertAction: ({data, index, ...layerPart}) => {
            const vueFlow = useVueFlow(createVueFlowId())
            const layer: MindMapLayer = shallowReactive({
                ...layerPart,
                vueFlow,
            })
            const {newNodes, newEdges} = prepareImportIntoMindMap(vueFlow, data)
            vueFlow.addNodes(newNodes)
            vueFlow.addEdges(newEdges)
            global.layers.splice(index, 0, layer)
        }
    })

    history.registerCommand("layer:visible:change", {
        applyAction: ({layerId, visible}) => {
            const layer = getLayer(layerId)
            const currentVisible = layer.visible ?? true
            layer.visible = visible
            return {layerId, visible: currentVisible}
        },
        revertAction: ({layerId, visible}) => {
            const layer = getLayer(layerId)
            layer.visible = visible
        }
    })

    history.registerCommand("layer:lock:change", {
        applyAction: ({layerId, lock}) => {
            const layer = getLayer(layerId)
            const currentLock = layer.lock ?? false
            layer.lock = lock
            return {layerId, lock: currentLock}
        },
        revertAction: ({layerId, lock}) => {
            const layer = getLayer(layerId)
            layer.lock = lock
        }
    })

    history.registerCommand("layer:data:change", {
        applyAction: ({layerId, newData}) => {
            const layer = getLayer(layerId)
            const oldData: Partial<MindMapLayerDiffData> = {}
            for (const key of getKeys(newData)) {
                const oldValue = layer[key]
                oldData[key] = oldValue as any
            }
            Object.assign(layer, newData)
            return {layerId, oldData}
        },
        revertAction: ({layerId, oldData}) => {
            const layer = getLayer(layerId)
            Object.assign(layer, oldData)
        }
    })

    history.registerCommand("layer:dragged", {
        applyAction: ({oldIndex, newIndex}) => {
            if (oldIndex < newIndex) {
                const removedItems = global.layers.splice(oldIndex, 1)
                global.layers.splice(newIndex - 1, 0, ...removedItems)
            } else if (oldIndex > newIndex) {
                const removedItems = global.layers.splice(oldIndex, 1)
                global.layers.splice(newIndex, 0, ...removedItems)
            }
            return {oldIndex, newIndex}
        },
        revertAction: ({oldIndex, newIndex}) => {
            if (oldIndex < newIndex) {
                const removedItems = global.layers.splice(newIndex - 1, 1)
                global.layers.splice(oldIndex, 0, ...removedItems)
            } else if (oldIndex > newIndex) {
                const removedItems = global.layers.splice(newIndex, 1)
                global.layers.splice(oldIndex, 0, ...removedItems)
            }
        }
    })


    history.registerCommand("layer:swapped", {
        applyAction: ({oldIndex, newIndex}) => {
            const tmp = global.layers[oldIndex]
            global.layers[oldIndex] = global.layers[newIndex]
            global.layers[newIndex] = tmp
            return {oldIndex, newIndex}
        },
        revertAction: ({oldIndex, newIndex}) => {
            const tmp = global.layers[oldIndex]
            global.layers[oldIndex] = global.layers[newIndex]
            global.layers[newIndex] = tmp
        }
    })

    history.registerCommand("layer:toggle", {
        applyAction: (layerId) => {
            const currentId = global.currentLayer.value.id
            global.toggleCurrentLayer(layerId)
            return currentId
        },
        revertAction: (layerId) => {
            global.toggleCurrentLayer(layerId)
        },
    })

    history.registerCommand("node:add", {
        applyAction: ({layerId, node}) => {
            const vueFlow = getVueFlow(layerId)
            vueFlow.addNodes({...node, zIndex: global.zIndexIncrement++})
            return {layerId, nodeId: node.id}
        },
        revertAction: ({layerId, nodeId}) => {
            const vueFlow = getVueFlow(layerId)
            const node = vueFlow.findNode(nodeId)
            if (node !== undefined) {
                vueFlow.removeSelectedNodes([node])
                vueFlow.removeNodes(nodeId)
                return {layerId, node: node as ContentNode}
            }
        }
    })

    history.registerCommand("node:move", {
        applyAction: ({layerId, id, newPosition, oldPosition}) => {
            const vueFlow = getVueFlow(layerId)
            vueFlow.updateNode(id, {
                position: newPosition
            })
            return {
                layerId,
                id,
                oldPosition
            }
        },
        revertAction: ({layerId, id, oldPosition}) => {
            const vueFlow = getVueFlow(layerId)
            vueFlow.updateNode(id, {
                position: oldPosition
            })
        }
    })

    const getGraphNode = (id: string, vueFlow: VueFlowStore): GraphNode => {
        const node = vueFlow.findNode(id)
        if (node === undefined) throw new Error(`node [${id}] is undefined`)
        return node
    }

    const getContentNode = (id: string, vueFlow: VueFlowStore): ContentNode => {
        const node = getGraphNode(id, vueFlow)
        if (!validateContentNode(node)) throw new Error(`node [${id}] is not a content node`)
        return node
    }

    history.registerCommand("node:data:change", {
        applyAction: ({layerId, id, data}) => {
            const vueFlow = getVueFlow(layerId)
            const node = getContentNode(id, vueFlow)

            const previousData = getRaw(node.data)
            vueFlow.updateNodeData(id, Object.assign({}, previousData, data), {replace: true})
            return {layerId, id, data: previousData}
        },
        revertAction: ({layerId, id, data}) => {
            const vueFlow = getVueFlow(layerId)
            const node = getContentNode(id, vueFlow)

            const currentData = getRaw(node.data)
            vueFlow.updateNodeData(id, data, {replace: true})
            return {layerId, id, data: currentData}
        }
    })

    history.registerCommand("node:resize", {
        applyAction: (options) => {
            const {layerId, id, newSize, newPosition} = options

            const vueFlow = getVueFlow(layerId)
            const node = getGraphNode(id, vueFlow)

            node.width = newSize.width
            node.height = newSize.height
            node.dimensions.width = newSize.width
            node.dimensions.height = newSize.height
            node.position.x = newPosition.x
            node.position.y = newPosition.y

            return options
        },
        revertAction: ({layerId, id, oldSize, oldPosition}) => {
            const vueFlow = getVueFlow(layerId)
            const node = getGraphNode(id, vueFlow)

            node.width = oldSize.width
            node.height = oldSize.height
            node.dimensions.width = oldSize.width
            node.dimensions.height = oldSize.height
            node.position.x = oldPosition.x
            node.position.y = oldPosition.y
        }
    })

    history.registerCommand("edge:add", {
        applyAction: ({layerId, edge}) => {
            const vueFlow = getVueFlow(layerId)
            vueFlow.addEdges({...edge, zIndex: global.zIndexIncrement++})
            return {layerId, edgeId: edge.id}
        },
        revertAction: ({layerId, edgeId}) => {
            const vueFlow = getVueFlow(layerId)
            const edge = vueFlow.findEdge(edgeId)
            if (edge !== undefined) {
                vueFlow.removeSelectedEdges([edge])
                vueFlow.removeEdges(edgeId)
                return {layerId, edge: edge as ContentEdge}
            }
        }
    })

    const getGraphEdge = (id: string, vueFlow: VueFlowStore): GraphEdge => {
        const edge = vueFlow.findEdge(id)
        if (edge === undefined) throw new Error(`edge [${id}] is undefined`)
        return edge
    }

    const getContentEdge = (id: string, vueFlow: VueFlowStore): ContentEdge => {
        const edge = getGraphEdge(id, vueFlow)
        if (!validateContentEdge(edge)) throw new Error(`edge [${id}] is not a content edge`)
        return edge
    }

    history.registerCommand("edge:reconnect", {
        applyAction: ({layerId, id, oldConnection, newConnection}) => {
            const vueFlow = getVueFlow(layerId)
            const edge = getGraphEdge(id, vueFlow)

            vueFlow.updateEdge(edge, newConnection, true)
            return {layerId, id: createEdgeId(newConnection), oldConnection}
        },
        revertAction: ({layerId, id, oldConnection}) => {
            const vueFlow = getVueFlow(layerId)
            const edge = getGraphEdge(id, vueFlow)

            vueFlow.updateEdge(edge, oldConnection, true)
        }
    })

    history.registerCommand("edge:data:change", {
        applyAction: ({layerId, id, data}) => {
            const vueFlow = getVueFlow(layerId)
            const edge = getContentEdge(id, vueFlow)

            const previousData = getRaw(edge.data)
            vueFlow.updateEdgeData(id, Object.assign({}, previousData, data), {replace: true})
            return {layerId, id, data: previousData}
        },
        revertAction: ({layerId, id, data}) => {
            const vueFlow = getVueFlow(layerId)
            const edge = getContentEdge(id, vueFlow)

            const currentData = getRaw(edge.data)
            vueFlow.updateEdgeData(id, data, {replace: true})
            return {layerId, id, data: currentData}
        }
    })

    history.registerCommand("import", {
        applyAction: ({layerId, nodes, edges}) => {
            const vueFlow = getVueFlow(layerId)
            vueFlow.addNodes(nodes)
            vueFlow.addEdges(edges)
            return {layerId, nodeIds: nodes.map(it => it.id), edgeIds: edges.map(it => it.id)}
        },
        revertAction: ({layerId, nodeIds, edgeIds}) => {
            const vueFlow = getVueFlow(layerId)

            const removedNodes: GraphNode[] = []
            const removedEdges: GraphEdge[] = []

            for (const edgeId of edgeIds) {
                const foundEdge = vueFlow.findEdge(edgeId)
                if (foundEdge) {
                    removedEdges.push(foundEdge)
                }
            }
            for (const nodeId of nodeIds) {
                const foundNode = vueFlow.findNode(nodeId)
                if (foundNode) {
                    removedNodes.push(foundNode)
                }
            }
            removedEdges.push(...vueFlow.getConnectedEdges(removedNodes))

            vueFlow.removeSelectedNodes(vueFlow.getSelectedNodes.value)
            vueFlow.removeSelectedEdges(vueFlow.getSelectedEdges.value)

            vueFlow.removeEdges(removedEdges)
            vueFlow.removeNodes(removedNodes)
        }
    })

    history.registerCommand("remove", {
        applyAction: ({layerId, nodes, edges}) => {
            const vueFlow = getVueFlow(layerId)

            const removedNodes: GraphNode[] = []
            const removedEdges: GraphEdge[] = []

            edges?.forEach((edge) => {
                const edgeId = typeof edge === "string" ? edge : edge.id
                const foundEdge = vueFlow.findEdge(edgeId)
                if (foundEdge) {
                    removedEdges.push(foundEdge)
                }
            })
            nodes?.forEach((node) => {
                const nodeId = typeof node === "string" ? node : node.id
                const foundNode = vueFlow.findNode(nodeId)
                if (foundNode) {
                    removedNodes.push(foundNode)
                }
            })
            removedEdges.push(...vueFlow.getConnectedEdges(removedNodes))

            vueFlow.removeSelectedNodes(vueFlow.getSelectedNodes.value)
            vueFlow.removeSelectedEdges(vueFlow.getSelectedEdges.value)

            vueFlow.removeEdges(removedEdges)
            vueFlow.removeNodes(removedNodes)

            return {
                layerId,
                nodes: removedNodes,
                edges: removedEdges
            }
        },
        revertAction: ({layerId, nodes, edges}) => {
            const vueFlow = getVueFlow(layerId)
            vueFlow.addNodes(nodes)
            vueFlow.addEdges(edges)
            return {layerId, nodes, edges}
        },
    })

    return {
        history,
        canUndo,
        canRedo,
    }
}
