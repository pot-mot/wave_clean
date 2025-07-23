import {ShallowReactive} from "vue";
import {VueFlowStore} from "@vue-flow/core";
import {CustomClipBoard} from "@/utils/clipBoard/useClipBoard.ts";
import {MindMapImportData} from "@/mindMap/import/import.ts";
import {MindMapExportData} from "@/mindMap/export/export.ts";
import {ContentNode, ContentNode_JsonSchema} from "@/mindMap/node/ContentNode.ts";
import {ContentEdge, ContentEdge_JsonSchema} from "@/mindMap/edge/ContentEdge.ts";
import {JSONSchemaType} from "ajv/lib/types/json-schema.ts";
import {createSchemaValidator} from "@/utils/type/typeGuard.ts";

// 思维导图图层（字面量，非响应式）类型
// 包含：
//  图层本身的基本信息
//  剪切板API
export type RawMindMapLayer = {
    readonly id: string,
    readonly vueFlow: VueFlowStore,
    name: string,
    visible: boolean,
    opacity: number,
} & CustomClipBoard<MindMapImportData, MindMapExportData>

// 思维导图图层类型（响应式）
export type MindMapLayer = ShallowReactive<RawMindMapLayer>

// 思维导图图层数据
export type MindMapLayerData = {
    id: string,
    name: string,
    visible: boolean,
    opacity: number,
    data: {
        nodes: ContentNode[],
        edges: ContentEdge[],
    }
}

export const MindMapLayerData_JsonSchema: JSONSchemaType<MindMapLayerData> = {
    type: "object",
    properties: {
        "id": {type: "string"},
        "name": {type: "string"},
        "visible": {type: "boolean"},
        "opacity": {type: "number"},
        "data": {
            type: "object",
            properties: {
                nodes: {type: "array", items: ContentNode_JsonSchema},
                edges: {type: "array", items: ContentEdge_JsonSchema},
            },
            required: ["nodes", "edges"]
        }
    },
    required: ["id", "name", "visible", "opacity", "data"]
}

export const validateMindMapLayerData = createSchemaValidator<MindMapLayerData>(MindMapLayerData_JsonSchema)

// 思维导图图层数据，包含其中需要被历史记录跟踪的部分
export const MindMapLayerDiffDataKeys = ['name', 'opacity'] as const
export type MindMapLayerDiffData = Pick<RawMindMapLayer, typeof MindMapLayerDiffDataKeys[number]>
