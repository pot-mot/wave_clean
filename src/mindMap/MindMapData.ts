import {createSchemaValidator} from "@/utils/type/typeGuard.ts";
import type {JSONSchemaType} from "ajv/lib/types/json-schema.ts";
import {ContentNode_JsonSchema} from "@/mindMap/node/ContentNode.ts";
import {ContentEdge_JsonSchema} from "@/mindMap/edge/ContentEdge.ts";
import {MindMapExportData} from "@/mindMap/export/export.ts";
import {ViewportTransform} from "@vue-flow/core";

// 思维导图数据
export type MindMapData = {
    zIndexIncrement: number,
    currentLayerId: string,
    layers: {
        id: string,
        name: string,
        visible: boolean,
        opacity: number,
        data: MindMapExportData
    }[],
    transform: ViewportTransform,
}

const MindMapData_JsonSchema: JSONSchemaType<MindMapData> = {
    type: "object",
    properties: {
        currentLayerId: {
            type: "string"
        },
        layers: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    "id": {
                        type: "string"
                    },
                    "name": {
                        type: "string"
                    },
                    "visible": {
                        type: "boolean"
                    },
                    "opacity": {
                        type: "number"
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
                required: ["id", "name", "visible", "opacity", "data"]
            }
        },
        transform: {
            type: "object",
            properties: {
                x: {
                    type: "number"
                },
                y: {
                    type: "number"
                },
                zoom: {
                    type: "number"
                }
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
