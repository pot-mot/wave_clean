import {createSchemaValidator} from "@/type/typeGuard.ts";
import {ContentEdge, ContentNode, MindMapData} from "@/mindMap/useMindMap.ts";
import type {JSONSchemaType} from "ajv/lib/types/json-schema.ts";
import type {MindMapImportData} from "@/mindMap/importExport/import.ts";

const ContentNode_JsonSchema: JSONSchemaType<ContentNode> = {
    type: "object",
    required: ["id", "type", "position", "data"],
    properties: {
        id: {type: "string"},
        type: {type: "string", enum: ["CONTENT_NODE"]},
        position: {type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, required: ["x", "y"]},
        data: {type: "object", properties: {content: {type: "string"}}, required: ["content"]}
    }
}

export const validateContentNode = createSchemaValidator<ContentNode>(ContentNode_JsonSchema)

const ContentEdge_JsonSchema: JSONSchemaType<ContentEdge> = {
    type: "object",
    required: ["id", "type", "source", "target", "sourceHandle", "targetHandle", "data"],
    properties: {
        id: {type: "string"},
        type: {type: "string", enum: ["CONTENT_EDGE"]},
        source: {type: "string"},
        target: {type: "string"},
        sourceHandle: {type: "string"},
        targetHandle: {type: "string"},
        data: {type: "object", properties: {content: {type: "string"}}, required: ["content"]}
    }
}

export const validateContentEdge = createSchemaValidator<ContentEdge>(ContentEdge_JsonSchema)

const MindMapImportData_JsonSchema: JSONSchemaType<MindMapImportData> = {
    type: "object",
    properties: {
        nodes: {type: "array", items: ContentNode_JsonSchema, nullable: true},
        edges: {type: "array", items: ContentEdge_JsonSchema, nullable: true},
    }
}

export const validateMindMapImportData = createSchemaValidator<MindMapImportData>(MindMapImportData_JsonSchema)

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
        },
        nodeIdIncrement: {
            type: "number"
        }
    },
    required: ["currentLayerId", "layers", "transform", "zIndexIncrement", "nodeIdIncrement"]
}

export const validateMindMapData = createSchemaValidator<MindMapData>(MindMapData_JsonSchema)
