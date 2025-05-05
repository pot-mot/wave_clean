import {VueFlowStore} from "@vue-flow/core";
import {CONTENT_EDGE_TYPE, CONTENT_NODE_TYPE, ContentEdge, ContentNode} from "@/mindMap/useMindMap.ts";
import {toRaw} from "vue";

export type MindMapExportData = {
    nodes: ContentNode[],
    edges: ContentEdge[],
}

export const exportMindMap = (vueFlow: VueFlowStore): MindMapExportData => {
    return {
        nodes: toRaw(vueFlow.getNodes.value.filter(it => it.type === CONTENT_NODE_TYPE) as ContentNode[]),
        edges: toRaw(vueFlow.getEdges.value.filter(it => it.type === CONTENT_EDGE_TYPE) as ContentEdge[])
    }
}

export const exportMindMapSelection = (vueFlow: VueFlowStore): MindMapExportData => {
    return {
        nodes: toRaw(vueFlow.getSelectedNodes.value.filter(it => it.type === CONTENT_NODE_TYPE) as ContentNode[]),
        edges: toRaw(vueFlow.getSelectedEdges.value.filter(it => it.type === CONTENT_EDGE_TYPE) as ContentEdge[])
    }
}
