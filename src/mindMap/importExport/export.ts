import {GraphEdge, GraphNode, VueFlowStore} from "@vue-flow/core";
import {CONTENT_EDGE_TYPE, CONTENT_NODE_TYPE, ContentEdge, ContentNode} from "@/mindMap/useMindMap.ts";
import {getRaw} from "@/json/getRaw.ts";

export type MindMapExportData = {
    nodes: ContentNode[],
    edges: ContentEdge[],
}

const toPureContentNode = (node: GraphNode): ContentNode => {
    return {
        id: node.id,
        type: "CONTENT_NODE",
        position: node.position,
        data: {
            content: node.data.content,
            color: node.data.color,
        },
    }
}

const toPureContentEdge = (edge: GraphEdge): ContentEdge => {
    return {
        id: edge.id,
        type: "CONTENT_EDGE",
        source: edge.source,
        sourceHandle: edge.sourceHandle!!,
        target: edge.target,
        targetHandle: edge.targetHandle!!,
        data: {
            content: edge.data.content,
            arrowType: edge.data.arrowType,
        }
    }
}

export const exportMindMap = (vueFlow: VueFlowStore): MindMapExportData => {
    return {
        nodes: getRaw(vueFlow.getNodes.value.filter(it => it.type === CONTENT_NODE_TYPE).map(toPureContentNode)),
        edges: getRaw(vueFlow.getEdges.value.filter(it => it.type === CONTENT_EDGE_TYPE).map(toPureContentEdge))
    }
}

export const exportMindMapSelection = (vueFlow: VueFlowStore): MindMapExportData => {
    return {
        nodes: getRaw(vueFlow.getSelectedNodes.value.filter(it => it.type === CONTENT_NODE_TYPE).map(toPureContentNode)),
        edges: getRaw(vueFlow.getSelectedEdges.value.filter(it => it.type === CONTENT_EDGE_TYPE).map(toPureContentEdge))
    }
}
