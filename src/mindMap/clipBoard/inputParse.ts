import {createSchemaValidator} from "@/type/typeGuard.ts";
import {ContentEdge, ContentNode} from "@/mindMap/useMindMap.ts";
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

const MindMapImportData: JSONSchemaType<MindMapImportData> = {
    type: "object",
    properties: {
        nodes: {type: "array", items: ContentNode_JsonSchema, nullable: true},
        edges: {type: "array", items: ContentEdge_JsonSchema, nullable: true},
    }
}

export const validateMindMapImportData = createSchemaValidator<MindMapImportData>(MindMapImportData)
