import {CommandDefinition, useCommandHistory} from "@/history/commandHistory.ts";
import {GraphEdge, GraphNode, useVueFlow, VueFlowStore, XYPosition} from "@vue-flow/core";
import {FullConnection} from "@/mindMap/edge/connection.ts";
import {
    ContentEdge,
    ContentEdgeData,
    ContentNode,
    ContentNodeData,
    createEdgeId, createVueFlowId,
    MindMapGlobal, MindMapLayer, MindMapLayerData,
    RawMindMapLayer
} from "@/mindMap/useMindMap.ts";
import {ref, shallowReactive} from "vue";
import {exportMindMap, MindMapExportData} from "@/mindMap/importExport/export.ts";
import {prepareImportIntoMindMap} from "@/mindMap/importExport/import.ts";
import {unimplementedClipBoard} from "@/clipBoard/useClipBoard.ts";
import {getRaw} from "@/json/getRaw.ts";
import {getKeys} from "@/type/typeGuard.ts";

export type MindMapHistoryCommands = {
    "layer:add": CommandDefinition<string>,
    "layer:remove": CommandDefinition<
        string,
        Omit<RawMindMapLayer, "vueFlow"> & { data: MindMapExportData, index: number }
    >,
    "layer:visible:change": CommandDefinition<
        { layerId: string, visible: boolean }
    >,
    "layer:data:change": CommandDefinition<{
        layerId: string,
        newData: Partial<MindMapLayerData>,
    }, {
        layerId: string,
        oldData: Partial<MindMapLayerData>,
    }>,
    "layer:toggle": CommandDefinition<string>,

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
        data: ContentNodeData,
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
        data: ContentEdgeData
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
    history.eventBus.on("change", () => {
        canUndo.value = history.canUndo()
        canRedo.value = history.canRedo()
    })
    history.eventBus.on("batchStop", () => {
        canUndo.value = history.canUndo()
        canRedo.value = history.canRedo()
    })

    history.registerCommand("layer:add", {
        applyAction: (layerId) => {
            const vueFlow = useVueFlow(createVueFlowId())
            const layer: MindMapLayer = shallowReactive({
                id: layerId,
                vueFlow,
                name: layerId,
                visible: true,
                opacity: 1,

                ...unimplementedClipBoard,
            })
            global.layers.push(layer)
            return layerId
        },
        revertAction: (layerId) => {
            const layerIndex = getLayerIndex(layerId)
            const layer = global.layers.splice(layerIndex, 1)[0]
            layer.vueFlow.$destroy()
        }
    })

    history.registerCommand("layer:remove", {
        applyAction: (layerId) => {
            const index = getLayerIndex(layerId)
            const {vueFlow, ...layerPart} = global.layers.splice(index, 1)[0]
            const data = exportMindMap(vueFlow)
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
            const currentVisible = layer.visible
            layer.visible = visible
            return {layerId, visible: currentVisible}
        },
        revertAction: ({layerId, visible}) => {
            const layer = getLayer(layerId)
            layer.visible = visible
        }
    })

    history.registerCommand("layer:data:change", {
        applyAction: ({layerId, newData}) => {
            const layer = getLayer(layerId)
            const oldData: Partial<MindMapLayerData> = {}
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


    history.registerCommand("node:data:change", {
        applyAction: ({layerId, id, data}) => {
            const vueFlow = getVueFlow(layerId)
            const node = vueFlow.findNode(id) as ContentNode | undefined
            if (node === undefined) throw new Error(`node [${id}] is undefined`)

            const previousData = getRaw(node.data)
            vueFlow.updateNodeData(id, data, {replace: true})
            return {layerId, id, data: previousData}
        },
        revertAction: ({layerId, id, data}) => {
            const vueFlow = getVueFlow(layerId)
            const node = vueFlow.findNode(id) as ContentNode | undefined
            if (node === undefined) throw new Error(`node [${id}] is undefined`)

            const currentData = getRaw(node.data)
            vueFlow.updateNodeData(id, data, {replace: true})
            return {layerId, id, data: currentData}
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

    history.registerCommand("edge:reconnect", {
        applyAction: ({layerId, id, oldConnection, newConnection}) => {
            const vueFlow = getVueFlow(layerId)
            const edge = vueFlow.findEdge(id)
            if (edge === undefined) throw new Error(`edge [${id}] is undefined`)

            vueFlow.updateEdge(edge, newConnection, true)
            return {layerId, id: createEdgeId(newConnection), oldConnection}
        },
        revertAction: ({layerId, id, oldConnection}) => {
            const vueFlow = getVueFlow(layerId)
            const edge = vueFlow.findEdge(id)
            if (edge === undefined) throw new Error(`edge [${id}] is undefined`)

            vueFlow.updateEdge(edge, oldConnection, true)
        }
    })

    history.registerCommand("edge:data:change", {
        applyAction: ({layerId, id, data}) => {
            const vueFlow = getVueFlow(layerId)
            const edge = vueFlow.findEdge(id) as ContentEdge | undefined
            if (edge === undefined) throw new Error(`edge [${id}] is undefined`)

            const previousData = getRaw(edge.data)
            vueFlow.updateEdgeData(id, data, {replace: true})
            return {layerId, id, data: previousData}
        },
        revertAction: ({layerId, id, data}) => {
            const vueFlow = getVueFlow(layerId)
            const edge = vueFlow.findEdge(id) as ContentEdge | undefined
            if (edge === undefined) throw new Error(`edge [${id}] is undefined`)

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
