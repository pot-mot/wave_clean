// 思维导图资源
import {JSONSchemaType} from "ajv/lib/types/json-schema.ts";
import {createSchemaValidator} from "@/utils/type/typeGuard.ts";

export const MindMapDataResourceType_CONSTANTS = [
    "image",
] as const
export type MindMapDataResourceType = typeof MindMapDataResourceType_CONSTANTS[number]

export type MindMapDataResource = {
    key: string,
    type: MindMapDataResourceType,
    value: string,
}

// 校验思维导图资源
export const MindMapDataResource_JsonSchema: JSONSchemaType<MindMapDataResource> = {
    type: "object",
    properties: {
        key: {type: "string"},
        type: {type: "string", enum: MindMapDataResourceType_CONSTANTS},
        value: {type: "string"}
    },
    required: ["key", "type", "value"]
}

export const validateMindMapDataResource = createSchemaValidator<MindMapDataResource>(MindMapDataResource_JsonSchema)