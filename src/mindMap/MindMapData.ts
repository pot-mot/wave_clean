import {createSchemaValidator} from "@/utils/type/typeGuard.ts";
import type {JSONSchemaType} from "ajv/lib/types/json-schema.ts";
import {type ViewportTransform} from "@vue-flow/core";
import {type MindMapLayerData, MindMapLayerData_JsonSchema} from "@/mindMap/layer/MindMapLayer.ts";
import {type MindMapDataResource, MindMapDataResource_JsonSchema} from "@/mindMap/resources/MindMapResouce.ts";

// 思维导图数据
export type MindMapData = {
    zIndexIncrement: number,
    currentLayerId: string,
    layers: MindMapLayerData[],
    resources?: MindMapDataResource[],
    transform: ViewportTransform,
}

const MindMapData_JsonSchema: JSONSchemaType<MindMapData> = {
    type: "object",
    properties: {
        currentLayerId: {type: "string"},
        layers: {
            type: "array",
            items: MindMapLayerData_JsonSchema
        },
        resources: {
            type: "array",
            items: MindMapDataResource_JsonSchema,
            nullable: true
        },
        transform: {
            type: "object",
            properties: {
                x: {type: "number"},
                y: {type: "number"},
                zoom: {type: "number"}
            },
            required: ["x", "y", "zoom"]
        },
        zIndexIncrement: {
            type: "number"
        }
    },
    required: ["currentLayerId", "layers", "transform", "zIndexIncrement"]
}

export const validateMindMapData = createSchemaValidator<MindMapData>(MindMapData_JsonSchema)
