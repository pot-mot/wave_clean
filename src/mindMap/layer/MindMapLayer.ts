import {type ShallowReactive} from "vue";
import {type VueFlowStore} from "@vue-flow/core";
import {type CustomClipBoard} from "@/utils/clipBoard/useClipBoard.ts";
import {type MindMapImportData} from "@/mindMap/import/import.ts";
import {type MindMapExportData} from "@/mindMap/export/export.ts";
import {type ContentNode, ContentNode_JsonSchema} from "@/mindMap/node/ContentNode.ts";
import {type ContentEdge, ContentEdge_JsonSchema} from "@/mindMap/edge/ContentEdge.ts";
import {type JSONSchemaType} from "ajv/lib/types/json-schema.ts";
import {createSchemaValidator} from "@/utils/type/typeGuard.ts";

// 思维导图图层（字面量，非响应式）类型
// 包含：
//  图层本身的基本信息
//  剪切板API
export type RawMindMapLayer = {
    readonly id: string,
    readonly vueFlow: VueFlowStore,
    name: string,
    opacity: number,
    visible?: boolean | undefined | null,
    lock?: boolean | undefined,
} & CustomClipBoard<MindMapImportData, MindMapExportData>

// 思维导图图层类型（响应式）
export type MindMapLayer = ShallowReactive<RawMindMapLayer>

// 思维导图图层数据
export type MindMapLayerData = {
    id: string,
    name: string,
    opacity: number,
    visible?: boolean | undefined | null,
    lock?: boolean | undefined | null,
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
        "opacity": {type: "number"},
        "visible": {
            type: "boolean",
            nullable: true
        },
        "lock": {
            type: "boolean",
            nullable: true
        },
        "data": {
            type: "object",
            properties: {
                nodes: {type: "array", items: ContentNode_JsonSchema},
                edges: {type: "array", items: ContentEdge_JsonSchema},
            },
            required: ["nodes", "edges"]
        }
    },
    required: ["id", "name", "opacity", "data"]
}

export const validateMindMapLayerData = createSchemaValidator<MindMapLayerData>(MindMapLayerData_JsonSchema)

// 思维导图图层数据，包含其中需要被历史记录跟踪的部分
export const MindMapLayerDiffDataKeys = ['name', 'opacity'] as const
export type MindMapLayerDiffData = Pick<RawMindMapLayer, typeof MindMapLayerDiffDataKeys[number]>
